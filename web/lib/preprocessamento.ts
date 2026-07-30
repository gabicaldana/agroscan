/**
 * Pré-processamento da imagem - porte da referência em Python
 * (app/preprocessamento.py).
 *
 * Transforma os pixels crus da câmera no tensor que o modelo espera:
 * redimensiona o lado menor para 256 com antisserrilhamento, recorta 224×224
 * no centro, normaliza e reordena para NCHW.
 *
 * POR QUE NÃO USAR `drawImage` PARA REDIMENSIONAR
 * -----------------------------------------------
 * Porque o resultado dele varia entre navegadores e não é o mesmo do treino.
 * O modelo receberia uma imagem sutilmente diferente da que viu, e responderia
 * com a mesma confiança de sempre - a perda de acurácia sumiria dentro de um
 * número que continua parecendo bom. Então a conta é refeita aqui à mão, e
 * `preprocessamento.test.ts` exige o mesmo digest que o Python produz.
 *
 * Três detalhes existem só para a paridade valer bit a bit, e nenhum deles é
 * capricho: intermediário em float64 (o `Float32Array` só aparece no fim),
 * passagem horizontal antes da vertical, e arredondamento de meio para cima
 * escrito à mão.
 */

import { PREPROCESSAMENTO } from "./contrato-modelo.ts";

const LADO_MENOR = PREPROCESSAMENTO.redimensionamento.ladoMenor;
const LADO_FINAL = PREPROCESSAMENTO.entrada.largura;
const MEDIA = PREPROCESSAMENTO.normalizacao.media;
const DESVIO = PREPROCESSAMENTO.normalizacao.desvio;
const ESCALA = PREPROCESSAMENTO.normalizacao.escala;

/**
 * Meio para cima, sempre.
 *
 * `Math.round` já faz isso, mas o Python arredonda meio para o PAR: lá
 * `round(2.5)` é 2. A referência usa `floor(v + 0.5)` e aqui se usa o mesmo,
 * explicitamente, para ninguém "simplificar" para `Math.round` mais tarde e
 * deslocar o tensor inteiro em um pixel.
 */
function arredondar(valor: number): number {
  return Math.floor(valor + 0.5);
}

/** Lado menor vai para 256, mantendo a proporção. */
export function tamanhoAposRedimensionar(
  largura: number,
  altura: number,
): [number, number] {
  if (largura <= altura) {
    return [LADO_MENOR, arredondar((altura * LADO_MENOR) / largura)];
  }
  return [arredondar((largura * LADO_MENOR) / altura), LADO_MENOR];
}

type Coeficiente = { inicio: number; pesos: number[] };

/**
 * Para cada pixel de saída: onde começa a janela e com que pesos.
 *
 * Filtro triangular. Quando a imagem DIMINUI, o suporte cresce na mesma
 * proporção - é isso que faz o antisserrilhamento. Sem alargar a janela,
 * reduzir uma folha com nervuras finas produz faixas de moiré que não existem
 * na planta, e o modelo classifica a textura inventada.
 */
function coeficientes(
  tamanhoEntrada: number,
  tamanhoSaida: number,
): Coeficiente[] {
  const escala = tamanhoEntrada / tamanhoSaida;
  const escalaDoFiltro = Math.max(1.0, escala);
  const suporte = escalaDoFiltro;

  const linhas: Coeficiente[] = [];
  for (let i = 0; i < tamanhoSaida; i++) {
    const centro = (i + 0.5) * escala;
    const inicio = Math.max(0, Math.floor(centro - suporte + 0.5));
    const fim = Math.min(tamanhoEntrada, Math.floor(centro + suporte + 0.5));

    const pesos: number[] = [];
    let total = 0.0;
    for (let x = inicio; x < fim; x++) {
      const distancia = Math.abs((x + 0.5 - centro) / escalaDoFiltro);
      const peso = distancia < 1.0 ? 1.0 - distancia : 0.0;
      pesos.push(peso);
      total += peso;
    }
    if (total > 0) {
      for (let k = 0; k < pesos.length; k++) pesos[k] /= total;
    }
    linhas.push({ inicio, pesos });
  }
  return linhas;
}

/**
 * Duas passagens separáveis: horizontal e depois vertical.
 *
 * A ordem importa. Soma de ponto flutuante não é associativa, então fazer
 * vertical primeiro daria valores diferentes no último bit e o digest nunca
 * bateria com o do Python.
 */
function redimensionar(
  pixels: ArrayLike<number>,
  largura: number,
  altura: number,
  novaLargura: number,
  novaAltura: number,
): Float64Array {
  const coefH = coeficientes(largura, novaLargura);
  const intermediario = new Float64Array(novaLargura * altura * 3);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < novaLargura; x++) {
      const { inicio, pesos } = coefH[x];
      for (let c = 0; c < 3; c++) {
        let acumulado = 0.0;
        for (let k = 0; k < pesos.length; k++) {
          acumulado += pesos[k] * pixels[(y * largura + inicio + k) * 3 + c];
        }
        intermediario[(y * novaLargura + x) * 3 + c] = acumulado;
      }
    }
  }

  const coefV = coeficientes(altura, novaAltura);
  const saida = new Float64Array(novaLargura * novaAltura * 3);
  for (let y = 0; y < novaAltura; y++) {
    const { inicio, pesos } = coefV[y];
    for (let x = 0; x < novaLargura; x++) {
      for (let c = 0; c < 3; c++) {
        let acumulado = 0.0;
        for (let k = 0; k < pesos.length; k++) {
          acumulado +=
            pesos[k] * intermediario[((inicio + k) * novaLargura + x) * 3 + c];
        }
        saida[(y * novaLargura + x) * 3 + c] = acumulado;
      }
    }
  }
  return saida;
}

/** Recorte central. Sobra ímpar cai para a esquerda e para cima. */
function recortarCentral(
  pixels: Float64Array,
  largura: number,
  altura: number,
  lado: number,
): Float64Array {
  const esquerda = Math.floor((largura - lado) / 2);
  const topo = Math.floor((altura - lado) / 2);
  const saida = new Float64Array(lado * lado * 3);
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const origem = ((topo + y) * largura + esquerda + x) * 3;
      const destino = (y * lado + x) * 3;
      for (let c = 0; c < 3; c++) saida[destino + c] = pixels[origem + c];
    }
  }
  return saida;
}

/** Escala, normaliza por canal e reordena de RGBRGB... para RRR...GGG...BBB. */
function normalizar(pixels: Float64Array, lado: number): Float32Array {
  const saida = new Float32Array(3 * lado * lado);
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < lado * lado; i++) {
      const valor = pixels[i * 3 + c] / ESCALA;
      saida[c * lado * lado + i] = (valor - MEDIA[c]) / DESVIO[c];
    }
  }
  return saida;
}

/** RGB intercalado (3 bytes por pixel) -> tensor NCHW pronto para o modelo. */
export function preprocessarRGB(
  pixels: ArrayLike<number>,
  largura: number,
  altura: number,
): Float32Array {
  if (largura < 1 || altura < 1) throw new Error("imagem vazia");
  if (pixels.length < largura * altura * 3) {
    throw new Error(
      `esperava ${largura * altura * 3} valores RGB, recebi ${pixels.length}`,
    );
  }

  const [novaLargura, novaAltura] = tamanhoAposRedimensionar(largura, altura);
  const redimensionado = redimensionar(
    pixels,
    largura,
    altura,
    novaLargura,
    novaAltura,
  );
  const recortado = recortarCentral(
    redimensionado,
    novaLargura,
    novaAltura,
    LADO_FINAL,
  );
  return normalizar(recortado, LADO_FINAL);
}

/**
 * O que sai de um `<canvas>`: RGBA.
 *
 * O alfa é descartado sem compor sobre fundo nenhum. A câmera sempre entrega
 * alfa 255, e compor contra branco mudaria o pixel caso um dia a imagem venha
 * de um PNG com transparência - mudança silenciosa que o modelo não saberia
 * distinguir de uma folha clara.
 */
export function preprocessar(imagem: {
  data: ArrayLike<number>;
  width: number;
  height: number;
}): Float32Array {
  const { data, width, height } = imagem;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < width * height; i++, j += 4) {
    rgb[i * 3] = data[j];
    rgb[i * 3 + 1] = data[j + 1];
    rgb[i * 3 + 2] = data[j + 2];
  }
  return preprocessarRGB(rgb, width, height);
}

/**
 * Imagens sintéticas por fórmula - as mesmas que a referência em Python gera.
 *
 * É o que permite testar paridade de pixel sem versionar imagem nenhuma: os
 * dois lados constroem a entrada do zero e comparam a saída.
 */
export function gerarImagem(
  padrao: string,
  largura: number,
  altura: number,
): Uint8Array {
  const pixels = new Uint8Array(largura * altura * 3);
  // Congruente linear com aritmética de 32 bits: `1103515245 * estado`
  // estoura o inteiro seguro do JavaScript, e a multiplicação normal perderia
  // precisão e daria outro ruído. `Math.imul` faz a conta em 32 bits, igual
  // ao Python com módulo 2^31.
  let estado = 42;
  const proximoRuido = () => {
    estado = (Math.imul(1103515245, estado) + 12345) & 0x7fffffff;
    return (estado >> 16) & 0xff;
  };

  let p = 0;
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (padrao === "gradiente") {
        pixels[p++] = Math.floor((x * 255) / Math.max(1, largura - 1));
        pixels[p++] = Math.floor((y * 255) / Math.max(1, altura - 1));
        pixels[p++] = Math.floor(
          ((x + y) * 255) / Math.max(1, largura + altura - 2),
        );
      } else if (padrao === "xadrez") {
        const v =
          (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0 ? 255 : 0;
        pixels[p++] = v;
        pixels[p++] = 255 - v;
        pixels[p++] = v;
      } else if (padrao === "listras") {
        const v = x % 2 === 0 ? 255 : 0;
        pixels[p++] = v;
        pixels[p++] = v;
        pixels[p++] = 255 - v;
      } else if (padrao === "ruido") {
        pixels[p++] = proximoRuido();
        pixels[p++] = proximoRuido();
        pixels[p++] = proximoRuido();
      } else {
        throw new Error(`padrao desconhecido: ${padrao}`);
      }
    }
  }
  return pixels;
}
