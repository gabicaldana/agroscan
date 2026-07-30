"""Pre-processamento da imagem - IMPLEMENTACAO DE REFERENCIA.

Transforma os pixels crus da camera no tensor que o modelo espera:

    RGB uint8 (tamanho qualquer)
      -> redimensiona o lado menor para 256, com antisserrilhamento
      -> recorta 224x224 no centro
      -> divide por 255, subtrai a media, divide pelo desvio
      -> float32 NCHW

POR QUE ISTO E CODIGO DO PROJETO, E NAO `transforms.Resize` DO TORCHVISION
--------------------------------------------------------------------------
O tensor gerado aqui tem que ser IDENTICO ao gerado no treino. Se o app
redimensionar de um jeito e o treino de outro, o modelo recebe uma imagem
diferente da que viu, e a acuracia medida no relatorio nao e a acuracia
entregue ao agronomo - a diferenca some no meio de um numero que continua
parecendo bom.

Duas saidas eram possiveis: reproduzir o PIL bit a bit no TypeScript, ou
definir o algoritmo aqui e mandar o treino usar ESTE. A primeira acorrenta o
projeto a detalhes internos do PIL (ele calcula os coeficientes em ponto fixo
de 22 bits, para uint8) e ficaria fragil. A segunda deixa os dois lados sob
nosso controle e testaveis um contra o outro - que e o mesmo caminho ja usado
no motor de sintomas.

Entao: o notebook de treino usa esta transformacao na avaliacao e no export.
E o `filtro triangular com suporte escalado`, que e o mesmo ALGORITMO do PIL,
so que em ponto flutuante.

O `drawImage` do navegador nao serve: ele nao redimensiona igual ao PIL nem
igual a si mesmo entre navegadores. O porte em TypeScript refaz esta conta a
mao sobre o RGBA cru.

Rodar:  python -m app.preprocessamento
"""

import hashlib
import json
import math
import struct

from app.db import RAIZ
from app.modelo import PREPROCESSAMENTO

CAMINHO_FIXTURES = RAIZ / "tests" / "fixtures" / "preprocessamento.json"

LADO_MENOR = PREPROCESSAMENTO["redimensionamento"]["lado_menor"]
LADO_FINAL = PREPROCESSAMENTO["entrada"]["largura"]
MEDIA = PREPROCESSAMENTO["normalizacao"]["media"]
DESVIO = PREPROCESSAMENTO["normalizacao"]["desvio"]
ESCALA = PREPROCESSAMENTO["normalizacao"]["escala"]


def arredondar(valor: float) -> int:
    """Meio para cima, sempre.

    NAO usar `round()`: o Python arredonda meio para o par e o JavaScript nao,
    entao `round(2.5)` da 2 aqui e 3 la. Numa imagem 320x240 reduzida para o
    lado menor 256 isso muda a altura de saida em um pixel, e todo o tensor
    sai deslocado.
    """
    return math.floor(valor + 0.5)


def tamanho_apos_redimensionar(largura: int, altura: int) -> tuple[int, int]:
    """Lado menor vai para 256, mantendo a proporcao."""
    if largura <= altura:
        return LADO_MENOR, arredondar(altura * LADO_MENOR / largura)
    return arredondar(largura * LADO_MENOR / altura), LADO_MENOR


def coeficientes(tamanho_entrada: int, tamanho_saida: int) -> list[tuple[int, list[float]]]:
    """Para cada pixel de saida: onde comeca a janela e com que pesos.

    Filtro triangular. Quando a imagem DIMINUI, o suporte do filtro cresce na
    mesma proporcao - e isso que faz o antisserrilhamento: sem alargar a
    janela, reduzir uma imagem listrada pega so um pixel a cada N e produz
    faixas de moire que nao existem na folha.
    """
    escala = tamanho_entrada / tamanho_saida
    escala_do_filtro = max(1.0, escala)
    suporte = escala_do_filtro  # suporte do triangulo = 1.0, vezes a escala

    linhas = []
    for i in range(tamanho_saida):
        centro = (i + 0.5) * escala
        inicio = max(0, math.floor(centro - suporte + 0.5))
        fim = min(tamanho_entrada, math.floor(centro + suporte + 0.5))

        pesos = []
        total = 0.0
        for x in range(inicio, fim):
            distancia = abs((x + 0.5 - centro) / escala_do_filtro)
            peso = 1.0 - distancia if distancia < 1.0 else 0.0
            pesos.append(peso)
            total += peso

        if total > 0:
            pesos = [p / total for p in pesos]
        linhas.append((inicio, pesos))
    return linhas


def redimensionar(
    pixels: list[float], largura: int, altura: int,
    nova_largura: int, nova_altura: int,
) -> list[float]:
    """Duas passagens separaveis: horizontal e depois vertical.

    A ORDEM IMPORTA. Soma de ponto flutuante nao e associativa, entao fazer
    vertical primeiro daria valores diferentes no ultimo bit e o porte em
    TypeScript nunca bateria. Horizontal primeiro, sempre.
    """
    coef_h = coeficientes(largura, nova_largura)
    intermediario = [0.0] * (nova_largura * altura * 3)
    for y in range(altura):
        for x in range(nova_largura):
            inicio, pesos = coef_h[x]
            for c in range(3):
                acumulado = 0.0
                for k, peso in enumerate(pesos):
                    acumulado += peso * pixels[(y * largura + inicio + k) * 3 + c]
                intermediario[(y * nova_largura + x) * 3 + c] = acumulado

    coef_v = coeficientes(altura, nova_altura)
    saida = [0.0] * (nova_largura * nova_altura * 3)
    for y in range(nova_altura):
        inicio, pesos = coef_v[y]
        for x in range(nova_largura):
            for c in range(3):
                acumulado = 0.0
                for k, peso in enumerate(pesos):
                    acumulado += peso * intermediario[
                        ((inicio + k) * nova_largura + x) * 3 + c]
                saida[(y * nova_largura + x) * 3 + c] = acumulado
    return saida


def recortar_central(
    pixels: list[float], largura: int, altura: int, lado: int
) -> list[float]:
    """Recorte central. Sobra impar cai para a esquerda e para cima.

    Divisao inteira, e nao `round((h - lado) / 2)`: de novo o arredondamento
    de meio, que difere entre as duas linguagens.
    """
    esquerda = (largura - lado) // 2
    topo = (altura - lado) // 2
    saida = [0.0] * (lado * lado * 3)
    for y in range(lado):
        for x in range(lado):
            origem = ((topo + y) * largura + esquerda + x) * 3
            destino = (y * lado + x) * 3
            for c in range(3):
                saida[destino + c] = pixels[origem + c]
    return saida


def normalizar(pixels: list[float], lado: int) -> list[float]:
    """Escala, normaliza por canal e reordena para NCHW.

    A camera entrega os canais intercalados (RGBRGB...); o modelo espera os
    tres planos separados (RRR...GGG...BBB...).
    """
    saida = [0.0] * (3 * lado * lado)
    for c in range(3):
        for i in range(lado * lado):
            valor = pixels[i * 3 + c] / ESCALA
            saida[c * lado * lado + i] = (valor - MEDIA[c]) / DESVIO[c]
    return saida


def preprocessar(pixels: list[int], largura: int, altura: int) -> list[float]:
    """RGB uint8 intercalado -> tensor NCHW pronto para o modelo."""
    if largura < 1 or altura < 1:
        raise ValueError("imagem vazia")

    nova_largura, nova_altura = tamanho_apos_redimensionar(largura, altura)
    redimensionado = redimensionar(
        [float(p) for p in pixels], largura, altura, nova_largura, nova_altura)
    recortado = recortar_central(
        redimensionado, nova_largura, nova_altura, LADO_FINAL)
    return normalizar(recortado, LADO_FINAL)


# ---------------------------------------------------------------- fixtures

def _lcg(semente: int):
    """Gerador congruente linear, para o ruido ser identico nas duas
    linguagens. `random` do Python e `Math.random` do JS nao servem: um nao
    reproduz o outro."""
    estado = semente
    while True:
        estado = (1103515245 * estado + 12345) % (1 << 31)
        yield (estado >> 16) & 0xFF


def gerar_imagem(padrao: str, largura: int, altura: int) -> list[int]:
    """Imagens sinteticas por formula. Nada de arquivo binario no repositorio:
    a fixture tem que ser reproduzivel dos dois lados a partir do codigo."""
    pixels = []
    ruido = _lcg(42)
    for y in range(altura):
        for x in range(largura):
            if padrao == "gradiente":
                pixels += [(x * 255) // max(1, largura - 1),
                           (y * 255) // max(1, altura - 1),
                           ((x + y) * 255) // max(1, largura + altura - 2)]
            elif padrao == "xadrez":
                v = 255 if ((x // 8) + (y // 8)) % 2 == 0 else 0
                pixels += [v, 255 - v, v]
            elif padrao == "listras":
                # Alta frequencia: 1 pixel claro, 1 escuro. E aqui que a falta
                # de antisserrilhamento vira moire visivel.
                v = 255 if x % 2 == 0 else 0
                pixels += [v, v, 255 - v]
            elif padrao == "ruido":
                pixels += [next(ruido), next(ruido), next(ruido)]
            else:
                raise ValueError(f"padrao desconhecido: {padrao}")
    return pixels


# Tamanhos escolhidos para forcar interpolacao de verdade: nao multiplos de
# 256, proporcoes diferentes, retrato e paisagem, e um caso que so aumenta.
CASOS = [
    ("gradiente", 300, 200),
    ("xadrez", 224, 224),
    ("listras", 101, 97),      # so aumenta: caminho de ampliacao
    ("listras", 800, 600),     # reduz muito: e aqui que o antisserrilhamento
                               # e a diferenca entre cinza e moire
    ("ruido", 640, 480),
    ("gradiente", 200, 350),
    ("xadrez", 97, 101),
]


def _resumo(tensor: list[float]) -> dict:
    """Digest exato mais alguns valores legiveis.

    O digest e sobre os bytes float32: se um unico valor divergir no ultimo
    bit, ele muda. Os valores soltos existem so para o erro ser diagnosticavel
    quando o digest nao bate.
    """
    bytes_float32 = struct.pack(f"<{len(tensor)}f", *tensor)
    # Passa por float32 antes de resumir, para bater com o Float32Array do TS.
    como_float32 = struct.unpack(f"<{len(tensor)}f", bytes_float32)

    soma = 0.0
    for v in como_float32:
        soma += v

    return {
        "sha256": hashlib.sha256(bytes_float32).hexdigest(),
        "primeiros": [round(v, 6) for v in como_float32[:8]],
        "ultimos": [round(v, 6) for v in como_float32[-8:]],
        "minimo": round(min(como_float32), 6),
        "maximo": round(max(como_float32), 6),
        "media": round(soma / len(como_float32), 6),
    }


def montar() -> dict:
    casos = []
    for padrao, largura, altura in CASOS:
        pixels = gerar_imagem(padrao, largura, altura)
        nova_largura, nova_altura = tamanho_apos_redimensionar(largura, altura)
        casos.append({
            "padrao": padrao,
            "largura": largura,
            "altura": altura,
            "apos_redimensionar": [nova_largura, nova_altura],
            "esperado": _resumo(preprocessar(pixels, largura, altura)),
        })

    return {
        "_comentario": (
            "GERADO AUTOMATICAMENTE por `python -m app.preprocessamento`. Nao "
            "editar a mao. Contrato de pixel entre a referencia em Python e o "
            "porte em TypeScript: as imagens sao geradas por formula dos dois "
            "lados, e o tensor resultante tem que ter o mesmo digest. E o que "
            "garante que o modelo receba no campo exatamente o que recebeu no "
            "treino."
        ),
        "gerado_por": "python -m app.preprocessamento",
        "parametros": PREPROCESSAMENTO,
        "casos": casos,
    }


def gerar() -> None:
    conteudo = montar()
    with open(CAMINHO_FIXTURES, "w", encoding="utf-8", newline="\n") as f:
        json.dump(conteudo, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Fixtures em {CAMINHO_FIXTURES}")
    for caso in conteudo["casos"]:
        print(f"  {caso['padrao']:>10} {caso['largura']}x{caso['altura']}"
              f" -> {caso['apos_redimensionar'][0]}x"
              f"{caso['apos_redimensionar'][1]} -> 224x224"
              f"  {caso['esperado']['sha256'][:12]}")


if __name__ == "__main__":
    gerar()
