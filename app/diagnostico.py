"""Motor de diagnostico por sintomas - IMPLEMENTACAO DE REFERENCIA.

Recebe uma cultura e um conjunto de sintomas observados, e devolve as doencas
ordenadas por compatibilidade.

NOTA DE PROJETO
---------------
A pontuacao aqui NAO e uma probabilidade. E um indice de compatibilidade
(variante ponderada do indice de Tversky). Chamar isso de "confianca de 92%"
seria desonesto: o sistema nao tem modelo probabilistico por tras. Quando o
modelo de imagem entrar no app (fase 5), ele vai produzir uma confianca real,
e as duas coisas vao conviver como sinais distintos.

Este arquivo e a referencia. O app roda o porte em TypeScript
(web/lib/diagnostico.ts), que e testado contra as fixtures geradas daqui
(app/fixtures.py) para que as duas implementacoes nao divirjam.

Por isso toda a saida e DETERMINISTICA: nenhuma lista sai de iteracao de set,
e todo empate tem criterio de desempate explicito. Sem isso, a ordem mudaria
entre execucoes do Python e nunca bateria com a do TypeScript.

A funcao `diagnosticar` e o ponto de extensao: na fase 5 ela ganha um parametro
opcional com as probabilidades vindas da CNN, e combina os dois sinais.
"""

import unicodedata
from dataclasses import dataclass, field

from app.db import conectar

# Quanto penalizar um sintoma que o usuario marcou mas que a doenca nao explica.
# 0 = ignora sintomas sobrando; 1 = pesa tanto quanto um sintoma faltando.
PENALIDADE_SINTOMA_NAO_EXPLICADO = 0.5

# Abaixo disso a hipotese e fraca demais para ser mostrada.
LIMIAR_MINIMO = 0.15

ROTULOS_GRAVIDADE = {
    1: "Muito baixa", 2: "Baixa", 3: "Media", 4: "Alta", 5: "Muito alta",
}


@dataclass(frozen=True)
class SintomaPontuado:
    """Sintoma dentro do perfil de uma doenca, com o peso que ele tem la."""
    id: str
    nome: str
    peso: float


@dataclass(frozen=True)
class SintomaRef:
    """Sintoma marcado que a doenca em questao nao explica - nao tem peso."""
    id: str
    nome: str


@dataclass
class Hipotese:
    """Uma doenca candidata, com o porque da pontuacao."""
    doenca_id: str
    nome: str
    agente: str
    tipo_agente: str
    gravidade: int
    compatibilidade: float
    classe_modelo: str | None = None
    sintomas_compativeis: list[SintomaPontuado] = field(default_factory=list)
    sintomas_esperados_ausentes: list[SintomaPontuado] = field(default_factory=list)
    sintomas_nao_explicados: list[SintomaRef] = field(default_factory=list)

    @property
    def compatibilidade_pct(self) -> int:
        return round(self.compatibilidade * 100)

    @property
    def rotulo_gravidade(self) -> str:
        return ROTULOS_GRAVIDADE[self.gravidade]


@dataclass(frozen=True)
class Pergunta:
    """A proxima observacao a fazer no campo.

    `descarta` so vem preenchido quando o sintoma e de fato discriminante:
    esperado pela primeira hipotese e ausente do perfil da segunda. Nesse caso
    a resposta separa as duas de uma vez. Quando as duas esperam o mesmo
    sintoma, a pergunta ainda ajuda a confirmar a lider, mas nao desempata -
    e a interface nao deve prometer que desempata.
    """
    sintoma_id: str
    nome: str
    confirma: str
    descarta: str | None = None


def chave_alfabetica(texto: str) -> str:
    """Chave de ordenacao alfabetica para portugues.

    Ordenar por codigo de caractere joga todo acento para depois do 'z':
    "Pessego" viria depois de "Pimentao" e "Acaros" iria para o fim da lista.
    Tirar os diacriticos antes de comparar devolve a ordem que o usuario
    espera. O porte em TypeScript faz exatamente isto (NFD + descarte dos
    combinantes), senao as duas listas sairiam em ordens diferentes.
    """
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if not unicodedata.combining(c)
    )
    return sem_acento.casefold()


def listar_culturas(apenas_com_doencas: bool = False) -> list[dict]:
    """As culturas da base.

    `apenas_com_doencas` filtra as que o modelo conhece so como saudaveis
    (mirtilo e framboesa no PlantVillage): oferece-las no fluxo por sintomas
    seria um beco sem saida.
    """
    con = conectar()
    # Colunas explicitas, e nao `c.*`: `prefixo_modelo` e contrato do modelo
    # de imagem, nao dado do fluxo por sintomas, e nao tem por que atravessar
    # ate o seletor de cultura.
    sql = """SELECT c.id, c.nome, c.nome_cientifico, c.emoji,
                    COUNT(d.id) AS n_doencas
               FROM cultura c LEFT JOIN doenca d ON d.cultura_id = c.id
              GROUP BY c.id"""
    if apenas_com_doencas:
        sql += " HAVING n_doencas > 0"
    linhas = con.execute(sql).fetchall()
    con.close()
    return sorted((dict(l) for l in linhas),
                  key=lambda c: chave_alfabetica(c["nome"]))


def listar_sintomas_da_cultura(cultura_id: str) -> list[dict]:
    """So os sintomas que aparecem em alguma doenca daquela cultura.

    Evita mostrar ao usuario sintomas irrelevantes para o que ele plantou -
    das 47 entradas do catalogo, cada cultura usa entre 2 e 20.
    """
    con = conectar()
    linhas = con.execute(
        """SELECT DISTINCT s.id, s.nome, s.orgao,
                  o.rotulo AS orgao_rotulo, o.ordem AS orgao_ordem
             FROM sintoma s
             JOIN orgao o ON o.id = s.orgao
             JOIN doenca_sintoma ds ON ds.sintoma_id = s.id
             JOIN doenca d ON d.id = ds.doenca_id
            WHERE d.cultura_id = ?""",
        (cultura_id,),
    ).fetchall()
    con.close()
    return sorted((dict(l) for l in linhas),
                  key=lambda s: (s["orgao_ordem"], chave_alfabetica(s["nome"])))


def diagnosticar(cultura_id: str, sintomas_marcados: set[str]) -> list[Hipotese]:
    """Pontua todas as doencas da cultura contra os sintomas observados.

                              acertos
    compatibilidade = ---------------------------------
                      acertos + faltantes + ruido * 0.5
    """
    if not sintomas_marcados:
        return []

    con = conectar()
    doencas = con.execute(
        "SELECT * FROM doenca WHERE cultura_id = ? ORDER BY id", (cultura_id,)
    ).fetchall()

    perfis = con.execute(
        """SELECT ds.doenca_id, ds.sintoma_id, ds.peso
             FROM doenca_sintoma ds
             JOIN doenca d ON d.id = ds.doenca_id
            WHERE d.cultura_id = ?""",
        (cultura_id,),
    ).fetchall()

    nomes_sintomas = {
        l["id"]: l["nome"]
        for l in con.execute("SELECT id, nome FROM sintoma").fetchall()
    }
    con.close()

    # Um id que nao existe no catalogo e descartado, nao contado como ruido.
    # O caso real e o app servido de um cache antigo pelo service worker,
    # marcando um sintoma que a base ja removeu: trata-lo como ruido
    # penalizaria todas as hipoteses por igual e estragaria o diagnostico
    # inteiro por causa de um id obsoleto.
    sintomas_marcados = {s for s in sintomas_marcados if s in nomes_sintomas}
    if not sintomas_marcados:
        return []

    # doenca_id -> {sintoma_id: peso}
    perfil_por_doenca: dict[str, dict[str, float]] = {}
    for l in perfis:
        perfil_por_doenca.setdefault(l["doenca_id"], {})[l["sintoma_id"]] = l["peso"]

    hipoteses = []
    for d in doencas:
        perfil = perfil_por_doenca.get(d["id"], {})
        if not perfil:
            continue

        # sorted() em tudo: a ordem de um set em Python depende do hash das
        # strings e mudaria entre execucoes. A soma de floats nao e associativa,
        # entao ordem instavel daria compatibilidades diferentes a cada rodada
        # - e nunca identicas as do TypeScript.
        compativeis = _ordenar_por_peso(
            sorted(sintomas_marcados & perfil.keys()), perfil, nomes_sintomas)
        ausentes = _ordenar_por_peso(
            sorted(perfil.keys() - sintomas_marcados), perfil, nomes_sintomas)
        nao_explicados = [
            SintomaRef(id=s, nome=nomes_sintomas[s])
            for s in sorted(sintomas_marcados - perfil.keys())
        ]

        acertos = sum(s.peso for s in compativeis)
        faltantes = sum(s.peso for s in ausentes)
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
            classe_modelo=d["classe_modelo"],
            sintomas_compativeis=compativeis,
            sintomas_esperados_ausentes=ausentes,
            sintomas_nao_explicados=nao_explicados,
        ))

    # Empate em compatibilidade: sobe a mais grave, porque o custo de ignorar
    # a doenca mais destrutiva e maior. Empate tambem na gravidade: o id, que
    # nao significa nada mas garante ordem identica nas duas implementacoes.
    hipoteses.sort(key=lambda h: (-h.compatibilidade, -h.gravidade, h.doenca_id))
    return hipoteses


def _ordenar_por_peso(
    ids: list[str], perfil: dict[str, float], nomes: dict[str, str]
) -> list[SintomaPontuado]:
    """Maior peso primeiro; o id desempata para a ordem ser reproduzivel."""
    return [
        SintomaPontuado(id=s, nome=nomes[s], peso=perfil[s])
        for s in sorted(ids, key=lambda x: (-perfil[x], x))
    ]


def melhor_pergunta(hipoteses: list[Hipotese]) -> Pergunta | None:
    """O sintoma que o agronomo deve ir verificar na planta agora.

    Entre os sintomas que a hipotese lider espera e que ainda nao foram
    marcados, escolhe o de maior `peso_na_lider - peso_na_segunda`.

    Essa diferenca e exatamente o quanto a resposta afasta as duas hipoteses:
    se o sintoma estiver presente, ambas ganham, mas a lider ganha a mais
    justamente essa diferenca. Um sintoma que as duas esperam com o mesmo peso
    tem diferenca zero - confirma o quadro e nao decide nada.

    Nao basta pegar o de maior peso: o sintoma mais caracteristico da lider
    costuma ser tambem caracteristico da concorrente, que e por que as duas
    estao empatadas. Nao basta so exigir que a segunda nao o espere: um
    sintoma ocasional exclusivo separa menos que um sintoma classico que a
    concorrente espera fraco.

    Sem segunda colocada, a diferenca vira o proprio peso e a regra se reduz
    a "pergunte o sintoma mais caracteristico".
    """
    if not hipoteses:
        return None

    lider = hipoteses[0]
    if not lider.sintomas_esperados_ausentes:
        return None

    segunda = hipoteses[1] if len(hipoteses) > 1 else None
    perfil_segunda: dict[str, float] = {}
    if segunda is not None:
        for s in segunda.sintomas_compativeis + segunda.sintomas_esperados_ausentes:
            perfil_segunda[s.id] = s.peso

    escolhido = min(
        lider.sintomas_esperados_ausentes,
        # min() com sinais invertidos, e o id por ultimo, para dar a mesma
        # escolha em Python e em TypeScript quando ha empate.
        key=lambda s: (-(s.peso - perfil_segunda.get(s.id, 0.0)), -s.peso, s.id),
    )

    # So promete descartar a segunda quando ela nao espera esse sintoma de
    # forma alguma. Se ela tambem o espera, ainda que mais fraco, dizer que a
    # resposta a descarta seria exagero - e a interface repete o que o motor
    # afirma aqui.
    descarta = (
        segunda.nome
        if segunda is not None and escolhido.id not in perfil_segunda
        else None
    )
    return Pergunta(
        sintoma_id=escolhido.id,
        nome=escolhido.nome,
        confirma=lider.nome,
        descarta=descarta,
    )


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
        "SELECT nome, grupo, acao FROM ingrediente_ativo WHERE doenca_id = ?"
        " ORDER BY id",
        (doenca_id,),
    ).fetchall()
    con.close()

    return {
        "id": d["id"],
        "nome": d["nome"],
        "cultura": d["cultura_nome"],
        "emoji": d["emoji"],
        "classe_modelo": d["classe_modelo"],
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
