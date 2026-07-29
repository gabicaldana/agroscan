"""Interface de terminal do diagnostico por sintomas.

Rodar:  python -m app.cli

Esta e a fase 1 do projeto. A fase 2 troca este arquivo por uma API FastAPI
que expoe exatamente as mesmas funcoes de app.diagnostico - a logica de
negocio nao muda.
"""

import sys

from app.diagnostico import (
    LIMIAR_MINIMO,
    detalhar_doenca,
    diagnosticar,
    listar_culturas,
    listar_sintomas_da_cultura,
    melhor_pergunta,
)

LARGURA = 68

AVISO_LEGAL = (
    "AVISO: este sistema e educativo e nao substitui a avaliacao de um\n"
    "engenheiro agronomo. No Brasil, a aquisicao e a aplicacao de defensivos\n"
    "agricolas exigem receituario agronomico. Os ingredientes ativos listados\n"
    "sao informativos - confira o registro para a sua cultura e regiao no\n"
    "AGROFIT/MAPA antes de qualquer aplicacao."
)


def regra(caractere: str = "-") -> None:
    print(caractere * LARGURA)


def titulo(texto: str) -> None:
    print()
    regra("=")
    print(f" {texto}")
    regra("=")


def barra_gravidade(nivel: int) -> str:
    return "#" * nivel + "." * (5 - nivel)


def perguntar_inteiro(prompt: str, minimo: int, maximo: int) -> int:
    while True:
        resposta = input(prompt).strip()
        if resposta.isdigit() and minimo <= int(resposta) <= maximo:
            return int(resposta)
        print(f"  Digite um numero entre {minimo} e {maximo}.")


def escolher_cultura() -> dict:
    # So as culturas que tem doenca cadastrada: as demais seriam beco sem saida.
    culturas = listar_culturas(apenas_com_doencas=True)
    titulo("QUAL E A CULTURA?")
    for i, c in enumerate(culturas, 1):
        print(f"  {i}. {c['emoji']}  {c['nome']}  ({c['nome_cientifico']})")
    print()
    escolha = perguntar_inteiro("Numero da cultura: ", 1, len(culturas))
    return culturas[escolha - 1]


def escolher_sintomas(cultura: dict) -> set[str]:
    sintomas = listar_sintomas_da_cultura(cultura["id"])

    titulo(f"O QUE VOCE OBSERVA NO(A) {cultura['nome'].upper()}?")
    orgao_atual = None
    for i, s in enumerate(sintomas, 1):
        if s["orgao"] != orgao_atual:
            orgao_atual = s["orgao"]
            print(f"\n  [{s['orgao_rotulo']}]")
        print(f"  {i:>2}. {s['nome']}")

    print()
    print("Digite os numeros separados por espaco (ex: 1 4 7)")

    while True:
        entrada = input("Sintomas observados: ").split()
        indices = [int(x) for x in entrada if x.isdigit()]
        validos = {sintomas[i - 1]["id"] for i in indices
                   if 1 <= i <= len(sintomas)}
        if validos:
            return validos
        print("  Marque pelo menos um sintoma valido.")


def mostrar_ranking(hipoteses: list) -> None:
    titulo("HIPOTESES DIAGNOSTICAS")
    print("Ordenadas por compatibilidade com os sintomas marcados.")
    print("Compatibilidade NAO e probabilidade - e o quanto o quadro observado")
    print("bate com o perfil tipico da doenca.\n")

    for i, h in enumerate(hipoteses, 1):
        print(f"  {i}. {h.nome}")
        print(f"     {h.agente} ({h.tipo_agente})")
        print(f"     Compatibilidade: {h.compatibilidade_pct}%"
              f"   |   Gravidade: {barra_gravidade(h.gravidade)} "
              f"{h.rotulo_gravidade}")

        if h.sintomas_esperados_ausentes:
            print(f"     Para confirmar, verifique tambem: "
                  f"{h.sintomas_esperados_ausentes[0].nome}")
        print()

    pergunta = melhor_pergunta(hipoteses)
    if pergunta:
        regra()
        print("PROXIMA OBSERVACAO A FAZER NA PLANTA")
        print(f"  {pergunta.nome}")
        if pergunta.descarta:
            print(f"  Confirma {pergunta.confirma} e afasta {pergunta.descarta}.")
        else:
            print(f"  Ajuda a confirmar {pergunta.confirma}.")
        regra()
        print()


def mostrar_ficha(doenca_id: str) -> None:
    d = detalhar_doenca(doenca_id)

    titulo(f"{d['emoji']}  {d['nome'].upper()}")
    print(f"Cultura ......: {d['cultura']}")
    print(f"Agente causal : {d['agente']} ({d['tipo_agente']})")
    print(f"Gravidade ....: {barra_gravidade(d['gravidade'])} "
          f"({d['gravidade']}/5)")

    print("\n>> DESCRICAO")
    regra()
    for linha in quebrar(d["descricao"]):
        print(linha)

    print("\n>> CONDICOES FAVORAVEIS AO APARECIMENTO")
    regra()
    cond = d["condicoes_favoraveis"]
    print(f"Temperatura : {cond['temperatura']}")
    print(f"Umidade ....: {cond['umidade']}")
    for linha in quebrar(cond["observacao"]):
        print(linha)

    print("\n>> MANEJO E TRATAMENTO")
    regra()
    tipo_atual = None
    for t in d["tratamentos"]:
        if t["tipo"] != tipo_atual:
            tipo_atual = t["tipo"]
            print(f"\n  [{tipo_atual.upper()}]")
        for j, linha in enumerate(quebrar(t["descricao"], recuo=6)):
            print(("    - " + linha.lstrip()) if j == 0 else linha)

    print("\n>> INGREDIENTES ATIVOS DE REFERENCIA")
    regra()
    for i in d["ingredientes_ativos"]:
        print(f"  - {i['nome']}")
        print(f"      grupo: {i['grupo']}  |  acao: {i['acao']}")

    print()
    regra("!")
    print(AVISO_LEGAL)
    regra("!")


def quebrar(texto: str, recuo: int = 0) -> list[str]:
    """Quebra o texto na largura do terminal, sem cortar palavras."""
    palavras = texto.split()
    linhas, atual = [], ""
    prefixo = " " * recuo
    for p in palavras:
        candidata = f"{atual} {p}".strip()
        if len(candidata) + recuo > LARGURA:
            linhas.append(prefixo + atual)
            atual = p
        else:
            atual = candidata
    if atual:
        linhas.append(prefixo + atual)
    return linhas


def main() -> None:
    # Garante acentos e emoji corretos no terminal do Windows.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    titulo("DIAGNOSTICO DE DOENCAS EM PLANTAS")
    print("Fase 1 - consulta por sintomas.")

    cultura = escolher_cultura()
    sintomas = escolher_sintomas(cultura)

    hipoteses = diagnosticar(cultura["id"], sintomas)

    if not hipoteses:
        titulo("NENHUMA HIPOTESE COMPATIVEL")
        print("Os sintomas marcados nao formam um quadro compativel com as")
        print(f"doencas cadastradas para {cultura['nome']} (limiar de "
              f"{round(LIMIAR_MINIMO * 100)}%).")
        print("Revise os sintomas ou consulte um agronomo.")
        return

    mostrar_ranking(hipoteses)

    print(f"Ver a ficha completa de qual hipotese? (1 a {len(hipoteses)}, "
          f"ou 0 para sair)")
    escolha = perguntar_inteiro("> ", 0, len(hipoteses))
    if escolha:
        mostrar_ficha(hipoteses[escolha - 1].doenca_id)


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nEncerrado.")
