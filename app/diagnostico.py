"""Motor de diagnostico por sintomas.

Recebe uma cultura e um conjunto de sintomas observados, e devolve as doencas
ordenadas por compatibilidade.

NOTA DE PROJETO
---------------
A pontuacao aqui NAO e uma probabilidade. E um indice de compatibilidade
(variante ponderada do indice de Tversky). Chamar isso de "confianca de 92%"
seria desonesto: o sistema nao tem modelo probabilistico por tras. Quando o
modelo de imagem entrar (fase 4), ele vai produzir uma confianca de verdade,
e as duas coisas vao conviver como sinais distintos.

A funcao `diagnosticar` e o ponto de extensao: na fase 5 ela ganha um parametro
opcional com as probabilidades vindas da CNN, e combina os dois sinais.
"""

from dataclasses import dataclass, field

from app.db import conectar

# Quanto penalizar um sintoma que o usuario marcou mas que a doenca nao explica.
# 0 = ignora sintomas sobrando; 1 = pesa tanto quanto um sintoma faltando.
PENALIDADE_SINTOMA_NAO_EXPLICADO = 0.5

# Abaixo disso a hipotese e fraca demais para ser mostrada.
LIMIAR_MINIMO = 0.15


@dataclass
class Hipotese:
    """Uma doenca candidata, com o porque da pontuacao."""
    doenca_id: str
    nome: str
    agente: str
    tipo_agente: str
    gravidade: int
    compatibilidade: float
    sintomas_compativeis: list[str] = field(default_factory=list)
    sintomas_esperados_ausentes: list[str] = field(default_factory=list)
    sintomas_nao_explicados: list[str] = field(default_factory=list)

    @property
    def compatibilidade_pct(self) -> int:
        return round(self.compatibilidade * 100)

    @property
    def rotulo_gravidade(self) -> str:
        return {
            1: "Muito baixa", 2: "Baixa", 3: "Media",
            4: "Alta", 5: "Muito alta",
        }[self.gravidade]


def listar_culturas() -> list[dict]:
    con = conectar()
    linhas = con.execute("SELECT * FROM cultura ORDER BY nome").fetchall()
    con.close()
    return [dict(l) for l in linhas]


def listar_sintomas_da_cultura(cultura_id: str) -> list[dict]:
    """Só os sintomas que aparecem em alguma doenca daquela cultura.

    Evita mostrar ao usuario sintomas irrelevantes para o que ele plantou.
    """
    con = conectar()
    linhas = con.execute(
        """SELECT DISTINCT s.id, s.nome, s.orgao
             FROM sintoma s
             JOIN doenca_sintoma ds ON ds.sintoma_id = s.id
             JOIN doenca d ON d.id = ds.doenca_id
            WHERE d.cultura_id = ?
            ORDER BY s.orgao, s.nome""",
        (cultura_id,),
    ).fetchall()
    con.close()
    return [dict(l) for l in linhas]


def diagnosticar(cultura_id: str, sintomas_marcados: set[str]) -> list[Hipotese]:
    """Pontua todas as doencas da cultura contra os sintomas observados."""
    if not sintomas_marcados:
        return []

    con = conectar()
    doencas = con.execute(
        "SELECT * FROM doenca WHERE cultura_id = ?", (cultura_id,)
    ).fetchall()

    perfis = con.execute(
        """SELECT ds.doenca_id, ds.sintoma_id, ds.peso, s.nome
             FROM doenca_sintoma ds
             JOIN sintoma s ON s.id = ds.sintoma_id
             JOIN doenca d ON d.id = ds.doenca_id
            WHERE d.cultura_id = ?""",
        (cultura_id,),
    ).fetchall()

    nomes_sintomas = {
        l["id"]: l["nome"]
        for l in con.execute("SELECT id, nome FROM sintoma").fetchall()
    }
    con.close()

    # doenca_id -> {sintoma_id: peso}
    perfil_por_doenca: dict[str, dict[str, float]] = {}
    for l in perfis:
        perfil_por_doenca.setdefault(l["doenca_id"], {})[l["sintoma_id"]] = l["peso"]

    hipoteses = []
    for d in doencas:
        perfil = perfil_por_doenca.get(d["id"], {})
        if not perfil:
            continue

        compativeis = sintomas_marcados & perfil.keys()
        ausentes = perfil.keys() - sintomas_marcados
        nao_explicados = sintomas_marcados - perfil.keys()

        acertos = sum(perfil[s] for s in compativeis)
        faltantes = sum(perfil[s] for s in ausentes)
        ruido = len(nao_explicados) * PENALIDADE_SINTOMA_NAO_EXPLICADO

        denominador = acertos + faltantes + ruido
        score = acertos / denominador if denominador else 0.0

        if score < LIMIAR_MINIMO:
            continue

        hipoteses.append(Hipotese(
            doenca_id=d["id"],
            nome=d["nome"],
            agente=d["agente"],
            tipo_agente=d["tipo_agente"],
            gravidade=d["gravidade"],
            compatibilidade=score,
            # Ordena os ausentes pelo peso: o primeiro da lista e a melhor
            # pergunta a fazer para confirmar ou descartar essa hipotese.
            sintomas_compativeis=[nomes_sintomas[s] for s in compativeis],
            sintomas_esperados_ausentes=[
                nomes_sintomas[s]
                for s in sorted(ausentes, key=lambda x: -perfil[x])
            ],
            sintomas_nao_explicados=[nomes_sintomas[s] for s in nao_explicados],
        ))

    hipoteses.sort(key=lambda h: (-h.compatibilidade, -h.gravidade))
    return hipoteses


def detalhar_doenca(doenca_id: str) -> dict:
    """Ficha completa: descricao, condicoes, tratamentos e ingredientes ativos."""
    con = conectar()
    d = con.execute(
        """SELECT d.*, c.nome AS cultura_nome, c.emoji
             FROM doenca d JOIN cultura c ON c.id = d.cultura_id
            WHERE d.id = ?""",
        (doenca_id,),
    ).fetchone()

    if d is None:
        con.close()
        raise KeyError(f"doenca desconhecida: {doenca_id}")

    tratamentos = con.execute(
        """SELECT tipo, descricao FROM tratamento
            WHERE doenca_id = ?
            ORDER BY CASE tipo
                       WHEN 'cultural'  THEN 1
                       WHEN 'biologico' THEN 2
                       WHEN 'quimico'   THEN 3
                       ELSE 4 END, id""",
        (doenca_id,),
    ).fetchall()

    ingredientes = con.execute(
        "SELECT nome, grupo, acao FROM ingrediente_ativo WHERE doenca_id = ?",
        (doenca_id,),
    ).fetchall()
    con.close()

    return {
        "id": d["id"],
        "nome": d["nome"],
        "cultura": d["cultura_nome"],
        "emoji": d["emoji"],
        "agente": d["agente"],
        "tipo_agente": d["tipo_agente"],
        "gravidade": d["gravidade"],
        "descricao": d["descricao"],
        "condicoes_favoraveis": {
            "temperatura": d["cond_temperatura"],
            "umidade": d["cond_umidade"],
            "observacao": d["cond_observacao"],
        },
        "tratamentos": [dict(t) for t in tratamentos],
        "ingredientes_ativos": [dict(i) for i in ingredientes],
    }
