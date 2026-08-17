"""Contrato entre a base de conhecimento e as 38 saidas do modelo de imagem.

O modelo devolve um vetor de 38 numeros. Sozinho ele nao diz nada: e preciso
saber que o indice 29 e `Tomato___Early_blight` e que essa classe abre a ficha
`tomate_pinta_preta`. Este modulo deriva esse mapeamento a partir da base
curada e o grava em data/contrato_modelo.json.

POR QUE ISTO EXISTE ANTES DO MODELO
-----------------------------------
Se a ordem usada no treino divergir desta em UMA posicao, a falha e silenciosa
e plausivel: uma foto de tomate vira `Tomato___Leaf_Mold` em vez de
`Late_blight`. Continua sendo doenca de tomate, a tela continua correta, e o
agronomo recebe o manejo errado. Nenhum teste de interface pega isso.

Entao a ordem e definida aqui, num lugar so, ANTES de qualquer treino - e o
notebook passa a conferir contra este arquivo em vez de decidir por conta.

A ORDEM
-------
`sorted()` sobre os rotulos, que e exatamente o que o
`torchvision.datasets.ImageFolder` produz ao varrer os diretorios do dataset.
E ordenacao por ponto de codigo, nao alfabetica, e isso tem consequencias que
parecem erro de digitacao mas nao sao:

  35 Tomato___Tomato_Yellow_Leaf_Curl_Virus
  36 Tomato___Tomato_mosaic_virus     <- depois, porque 'Y' (89) < 'm' (109)
  37 Tomato___healthy                 <- sempre no fim do bloco da cultura

Rodar:  python -m app.modelo
"""

import json

from app.db import RAIZ, carregar_json, validar

CAMINHO_CONTRATO = RAIZ / "data" / "contrato_modelo.json"

TOTAL_DE_CLASSES = 38

# Curado a mao: e decisao de engenharia, nao conteudo agronomico, e por isso
# nao mora em base_conhecimento.json. A fase 5 tem que reproduzir cada um
# destes valores em TypeScript - qualquer divergencia aqui vira acuracia
# perdida em silencio, porque o modelo recebe um tensor diferente do que viu
# no treino e mesmo assim responde com confianca.
PREPROCESSAMENTO = {
    "entrada": {
        "largura": 224,
        "altura": 224,
        "canais": 3,
        "layout": "NCHW",
        "tipo": "float32",
    },
    "redimensionamento": {
        # Transformacao de avaliacao padrao do torchvision: redimensiona o
        # lado menor para 256 mantendo proporcao, depois recorta 224 no centro.
        "lado_menor": 256,
        "recorte": "central",
        "metodo": "bilinear",
        "cantos_alinhados": False,
    },
    "normalizacao": {
        "escala": 255.0,
        "media": [0.485, 0.456, 0.406],
        "desvio": [0.229, 0.224, 0.225],
    },
    "saida": {
        # Logits, nunca softmax. O softmax fica do lado do TypeScript porque a
        # recusa da fase 5 precisa de temperatura e de energia, e as duas sao
        # impossiveis de calcular depois que o grafo ja normalizou.
        "tipo": "logits",
        "classes": TOTAL_DE_CLASSES,
    },
}

# Recusa: quando o app deve dizer "nao sei" em vez de responder.
#
# Os tres numeros sao NULOS ate a fase 4b: eles saem da curva risco-cobertura
# medida sobre imagens de validacao, e chutar um limiar seria pior que nao ter
# nenhum - daria ao agronomo uma recusa que nao significa nada. Enquanto forem
# nulos, o app calcula as pontuacoes e diz que o modelo nao esta calibrado.
RECUSA = {
    "temperatura": None,
    "limiar_msp": None,
    "limiar_energia": None,
    "calibrado_em": None,
    "medir_sobre": (
        "LOGITS CRUS, antes da mascara por cultura. A mascara renormaliza "
        "sobre as classes de uma cultura so, e isso faz QUALQUER imagem - "
        "inclusive uma mangueira apontada como tomate - sair com confianca "
        "alta. Calcular a recusa depois da mascara e o mesmo que nao ter "
        "recusa."
    ),
    "sabores_de_fora_da_distribuicao": [
        "cultura fora do dataset, DECLARADA na base - cana, cafe e algodao. "
        "O app nem chega a chamar o modelo quando o agronomo seleciona uma "
        "delas: `culturas_fora_do_modelo` resolve o caso antes da inferencia. "
        "Continuam sendo fora-da-distribuicao para o modelo, porque nada "
        "impede que uma folha de cafe seja fotografada com 'tomate' "
        "selecionado - e ai a recusa e a unica defesa.",
        "cultura fora do dataset e fora da base - feijao, trigo, manga. So a "
        "recusa pega, e depois dela a camada 3.",
        "cultura conhecida e classe desconhecida - doenca de soja, que o "
        "modelo so conhece saudavel. E o caso mais perigoso do app.",
    ],
}

# O que o notebook tem que garantir. Fica aqui, e nao so na prosa do notebook,
# para que a checagem seja copiavel e nao dependa de alguem lembrar.
CONTRATO_DE_TREINO = {
    "ordem_das_classes": (
        "sorted() sobre os rotulos, que e o que torchvision.datasets."
        "ImageFolder produz. Ordenacao por ponto de codigo, nao alfabetica."
    ),
    "assercao_obrigatoria": (
        "assert dataset.classes == [c['classe'] for c in contrato['classes']] "
        "- pega espelho do PlantVillage que 'conserta' o sublinhado final de "
        "Corn_(maize)___Common_rust_ ou troca por sublinhado o espaco de "
        "Tomato___Spider_mites Two-spotted_spider_mite."
    ),
    "metadata_onnx": (
        "gravar a lista de classes em metadata_props['classes'] como JSON. E "
        "a unica defesa contra service worker servindo um ONNX antigo junto de "
        "um bundle novo."
    ),
    "metricas": (
        "metricas.json tem que carregar classes_do_treino, para o repositorio "
        "poder afirmar que o modelo que voltou foi treinado nesta ordem."
    ),
}


def classes_canonicas(base: dict) -> list[str]:
    """As 38 classes na ordem em que o modelo as devolve.

    Uma linha so, de proposito: e a unica definicao de ordem do projeto
    inteiro. O TypeScript copia o resultado, nunca recalcula.
    """
    doencas = [d["classe_modelo"]
               for c in base["culturas"] for d in c["doencas"]
               if d["classe_modelo"] is not None]
    saudaveis = [s["classe_modelo"] for s in base["saudaveis"]]
    return sorted(doencas + saudaveis)


def montar() -> dict:
    base = carregar_json()
    validar(base)

    ordem = classes_canonicas(base)
    if len(ordem) != TOTAL_DE_CLASSES:
        raise ValueError(
            f"esperava {TOTAL_DE_CLASSES} classes, a base declara {len(ordem)}")

    # classe -> de onde ela veio
    dono: dict[str, dict] = {}
    for cultura in base["culturas"]:
        for d in cultura["doencas"]:
            if d["classe_modelo"] is not None:
                dono[d["classe_modelo"]] = {
                    "cultura_id": cultura["id"],
                    "tipo": "doenca",
                    "doenca_id": d["id"],
                }
    for s in base["saudaveis"]:
        dono[s["classe_modelo"]] = {
            "cultura_id": s["cultura_id"],
            "tipo": "saudavel",
            "doenca_id": None,
        }

    classes = [
        {"indice": i, "classe": classe, **dono[classe]}
        for i, classe in enumerate(ordem)
    ]

    # As culturas que o dataset nao contem de forma alguma. Ficam FORA de
    # `por_cultura`, e nao como lista vazia: uma lista vazia e indistinguivel
    # de cultura inexistente, e as duas situacoes pedem respostas diferentes
    # do app - "essa cultura nao existe" e um bug, "o modelo nao cobre cana"
    # e um fato permanente que o agronomo precisa ouvir antes de tirar a foto.
    fora_do_modelo = sorted(
        c["cultura_id"] for c in base["culturas_fora_do_modelo"])

    # A mascara por cultura, pre-calculada. O app zera tudo que nao esta na
    # lista da cultura escolhida e renormaliza - e o que impede o modelo de
    # responder requeima de batata para uma foto de tomate.
    por_cultura: dict[str, list[int]] = {
        c["id"]: [] for c in base["culturas"]
        if c["id"] not in set(fora_do_modelo)
    }
    for c in classes:
        por_cultura[c["cultura_id"]].append(c["indice"])

    return {
        "_comentario": (
            "GERADO AUTOMATICAMENTE por `python -m app.modelo`. Nao editar a "
            "mao. Liga cada saida do modelo de imagem a base de conhecimento: "
            "indice -> classe -> cultura e ficha. A ordem e sorted() sobre os "
            "rotulos, que e o que o ImageFolder do torchvision produz, e o "
            "notebook de treino tem que conferir contra ela antes de treinar."
        ),
        "gerado_por": "python -m app.modelo",
        "total_de_classes": TOTAL_DE_CLASSES,
        "classes": classes,
        "por_cultura": por_cultura,
        "culturas_fora_do_modelo": fora_do_modelo,
        "preprocessamento": PREPROCESSAMENTO,
        "recusa": RECUSA,
        "contrato_de_treino": CONTRATO_DE_TREINO,
        # Preenchidos quando o ONNX voltar do Colab. O sha256 e conferido no
        # download durante o build, para o app nunca servir um modelo que nao
        # seja o que foi medido no relatorio de validacao.
        "arquivo": {"nome": None, "sha256": None},
    }


def gerar() -> None:
    conteudo = montar()
    with open(CAMINHO_CONTRATO, "w", encoding="utf-8", newline="\n") as f:
        json.dump(conteudo, f, ensure_ascii=False, indent=2)
        f.write("\n")

    n_doenca = sum(1 for c in conteudo["classes"] if c["tipo"] == "doenca")
    n_saudavel = len(conteudo["classes"]) - n_doenca
    sem_saudavel = [
        c for c, indices in conteudo["por_cultura"].items()
        if not any(conteudo["classes"][i]["tipo"] == "saudavel" for i in indices)
    ]
    print(f"Contrato em {CAMINHO_CONTRATO}")
    print(f"  {len(conteudo['classes'])} classes: {n_doenca} de doenca, "
          f"{n_saudavel} saudaveis")
    print(f"  culturas sem classe saudavel: {', '.join(sem_saudavel)}")
    print(f"  culturas fora do modelo (sem saida nenhuma): "
          f"{', '.join(conteudo['culturas_fora_do_modelo'])}")


if __name__ == "__main__":
    gerar()
