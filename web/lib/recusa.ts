/**
 * Recusa: quando o app deve dizer "não sei" em vez de responder.
 *
 * Um classificador fechado responde *sempre* uma das 38 classes, com
 * confiança alta, mesmo diante de uma espécie que nunca viu. Aponte para uma
 * mangueira e ele devolve uma doença de tomate. Para um agrônomo isso é pior
 * que inútil - é uma recomendação de pulverização sobre um palpite.
 *
 * A ARMADILHA CENTRAL
 * -------------------
 * Todas as pontuações aqui são calculadas sobre os LOGITS CRUS, antes da
 * máscara por cultura. Isso não é detalhe de implementação: a máscara
 * renormaliza sobre as classes de uma cultura só, e depois disso QUALQUER
 * imagem sai com confiança alta - inclusive a mangueira. Medir a recusa
 * depois da máscara é o mesmo que não ter recusa.
 *
 * Por isso o contrato exige que o modelo exporte logits, e não softmax: com o
 * softmax já aplicado dentro do grafo, temperatura e energia ficam
 * impossíveis de calcular do lado do cliente.
 *
 * ESTADO ATUAL: os limiares são nulos. Eles saem da curva risco-cobertura
 * medida na fase 4b, e chutar um número seria pior que não ter nenhum - daria
 * ao agrônomo uma recusa que não significa nada. Enquanto não vierem, o app
 * calcula as pontuações e declara que o modelo não está calibrado.
 */

import { RECUSA } from "./contrato-modelo.ts";

export type Pontuacoes = {
  /** Maior probabilidade do softmax sobre os logits crus. */
  msp: number;
  /** Energia livre: quanto mais baixa, mais o modelo "reconhece" a imagem. */
  energia: number;
  /** Distância entre o maior e o segundo maior logit. */
  margem: number;
};

export type Veredito =
  | { decisao: "aceitar"; pontuacoes: Pontuacoes }
  | { decisao: "recusar"; pontuacoes: Pontuacoes; motivo: string }
  | { decisao: "nao_calibrado"; pontuacoes: Pontuacoes };

/** Se algum limiar ainda não foi medido, não há recusa a aplicar. */
export function estaCalibrado(): boolean {
  return RECUSA.temperatura !== null && RECUSA.limiarMsp !== null;
}

/**
 * Softmax numericamente estável, com temperatura.
 *
 * Subtrair o máximo antes de exponenciar não muda o resultado matemático e
 * evita `Math.exp` estourar para Infinity: um logit de 800, plausível num
 * modelo mal calibrado, viraria Infinity e o softmax inteiro viraria NaN.
 */
export function softmax(logits: ArrayLike<number>, temperatura = 1): Float64Array {
  if (!(temperatura > 0)) throw new Error("temperatura tem que ser positiva");

  let maximo = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    const v = logits[i] / temperatura;
    if (v > maximo) maximo = v;
  }

  const saida = new Float64Array(logits.length);
  let total = 0;
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i] / temperatura - maximo);
    saida[i] = e;
    total += e;
  }
  for (let i = 0; i < saida.length; i++) saida[i] /= total;
  return saida;
}

/** `log(sum(exp(x)))` sem estourar, pelo mesmo motivo do softmax. */
function logSomaExp(logits: ArrayLike<number>, temperatura: number): number {
  let maximo = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    const v = logits[i] / temperatura;
    if (v > maximo) maximo = v;
  }
  let total = 0;
  for (let i = 0; i < logits.length; i++) {
    total += Math.exp(logits[i] / temperatura - maximo);
  }
  return maximo + Math.log(total);
}

/**
 * As três pontuações, sobre os logits crus.
 *
 * São três porque falham de formas diferentes. A MSP satura: um modelo
 * excessivamente confiante dá 0,99 para lixo. A energia não satura e costuma
 * separar melhor o que está fora da distribuição. A margem pega o caso em que
 * o modelo hesita entre duas classes plausíveis, que é diferente de não
 * reconhecer nada.
 */
export function pontuar(logitsCrus: ArrayLike<number>): Pontuacoes {
  if (logitsCrus.length === 0) throw new Error("sem logits");

  const temperatura = RECUSA.temperatura ?? 1;
  const probabilidades = softmax(logitsCrus, temperatura);

  let msp = 0;
  for (let i = 0; i < probabilidades.length; i++) {
    if (probabilidades[i] > msp) msp = probabilidades[i];
  }

  let maior = -Infinity;
  let segundo = -Infinity;
  for (let i = 0; i < logitsCrus.length; i++) {
    const v = logitsCrus[i];
    if (v > maior) {
      segundo = maior;
      maior = v;
    } else if (v > segundo) {
      segundo = v;
    }
  }

  return {
    msp,
    energia: -temperatura * logSomaExp(logitsCrus, temperatura),
    margem: Number.isFinite(segundo) ? maior - segundo : maior,
  };
}

/**
 * Aceitar, recusar, ou admitir que ainda não dá para decidir.
 *
 * Recebe os logits CRUS de propósito - passar os mascarados é o erro que este
 * módulo inteiro existe para evitar, e a assinatura deixa isso explícito.
 */
export function avaliar(logitsCrus: ArrayLike<number>): Veredito {
  const pontuacoes = pontuar(logitsCrus);

  if (!estaCalibrado()) return { decisao: "nao_calibrado", pontuacoes };

  if (pontuacoes.msp < RECUSA.limiarMsp!) {
    return {
      decisao: "recusar",
      pontuacoes,
      motivo:
        "A imagem não se parece o bastante com nada que o modelo aprendeu.",
    };
  }
  if (RECUSA.limiarEnergia !== null && pontuacoes.energia > RECUSA.limiarEnergia) {
    return {
      decisao: "recusar",
      pontuacoes,
      motivo: "A imagem parece estar fora do domínio treinado.",
    };
  }
  return { decisao: "aceitar", pontuacoes };
}
