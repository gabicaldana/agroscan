/**
 * Máscara por cultura sobre a saída do modelo de imagem.
 *
 * O PlantVillage empacota cultura e doença na mesma classe
 * (`Tomato___Early_blight`), então um modelo de 38 saídas responde *sempre*
 * uma das 38 - inclusive requeima de batata para uma foto de tomate. Mas o
 * agrônomo *sabe* o que plantou. Ao informar a cultura, as classes das outras
 * treze são zeradas e o que sobra é renormalizado.
 *
 * Isto existe antes do modelo de propósito: dá para escrever e testar toda a
 * interpretação da saída sem que exista um ONNX, e assim a fase 5 fica sendo
 * só "ligar o modelo na entrada". Nenhuma função aqui carrega, baixa ou
 * executa modelo nenhum - todas recebem um vetor pronto.
 *
 * AVISO PARA A FASE 5, sobre a recusa: a máscara DESTRÓI a confiança como
 * sinal de fora-da-distribuição. Renormalizar sobre as dez classes de tomate
 * faz qualquer imagem - inclusive uma mangueira - sair com confiança alta. O
 * sinal de recusa tem que ser calculado sobre os logits crus, antes de
 * `mascararPorCultura`; só a resposta usa a distribuição mascarada.
 */

import {
  CLASSES,
  POR_CULTURA,
  TOTAL_DE_CLASSES,
  type ClasseModelo,
} from "./contrato-modelo.ts";
import {
  CULTURAS,
  SAUDAVEIS,
  type ClasseSaudavel,
  type Cultura,
} from "./base-conhecimento.ts";

export type Previsao = {
  classe: string;
  culturaId: string;
  /** Ficha a abrir, ou null quando o modelo respondeu "saudável". */
  doencaId: string | null;
  saudavel: boolean;
  /** Probabilidade JÁ renormalizada dentro da cultura. Não serve de sinal de
   *  fora-da-distribuição - ver o aviso no topo do arquivo. */
  confianca: number;
};

const SAUDAVEL_POR_CULTURA = new Map<string, ClasseSaudavel>(
  SAUDAVEIS.map((s) => [s.culturaId, s]),
);

/** O que o modelo pode responder para esta cultura. Vazio se ela não existe. */
export function indicesDaCultura(culturaId: string): readonly number[] {
  return POR_CULTURA[culturaId] ?? [];
}

/**
 * A classe saudável da cultura, ou null quando o dataset não tem uma.
 *
 * `Orange` e `Squash` não têm: o PlantVillage só traz laranja com greening e
 * abóbora com oídio. Para essas duas o modelo nunca consegue responder "sem
 * doença", e quem chama isto não pode assumir que sempre vem alguma coisa.
 */
export function classeSaudavelDe(culturaId: string): ClasseSaudavel | null {
  return SAUDAVEL_POR_CULTURA.get(culturaId) ?? null;
}

/**
 * As doenças que a base cobre e o modelo não sabe reconhecer.
 *
 * Derivado de `classeModelo === null`, nunca escrito à mão: é o buraco do
 * modelo, e ele tem que se manter sozinho quando a base mudar. Para soja são
 * as duas principais do Brasil - o modelo só conhece soja saudável, então uma
 * folha com ferrugem asiática cai na classe saudável com confiança alta. É
 * exatamente isso que o laudo precisa dizer em voz alta.
 */
export function doencasForaDoModelo(
  culturaId: string,
): { id: string; nome: string }[] {
  const cultura: Cultura | undefined = CULTURAS.find((c) => c.id === culturaId);
  return (cultura?.doencas ?? [])
    .filter((d) => d.classeModelo === null)
    .map((d) => ({ id: d.id, nome: d.nome }));
}

/**
 * Zera as classes que não são da cultura e renormaliza o que sobra.
 *
 * Devolve um vetor novo, do mesmo tamanho, cuja soma é 1 - a menos que a
 * cultura seja desconhecida ou que o modelo não tenha dado massa nenhuma às
 * classes dela, casos em que devolve tudo zero em vez de dividir por zero e
 * espalhar NaN pela tela.
 */
export function mascararPorCultura(
  probabilidades: ArrayLike<number>,
  culturaId: string,
): Float32Array {
  if (probabilidades.length !== TOTAL_DE_CLASSES) {
    throw new Error(
      `o modelo tem ${TOTAL_DE_CLASSES} saidas, recebi ${probabilidades.length}`,
    );
  }

  const mascarado = new Float32Array(TOTAL_DE_CLASSES);
  const indices = indicesDaCultura(culturaId);

  let total = 0;
  for (const i of indices) total += probabilidades[i];
  if (total <= 0) return mascarado;

  for (const i of indices) mascarado[i] = probabilidades[i] / total;
  return mascarado;
}

/**
 * A classe mais provável dentro da cultura informada.
 *
 * Empate resolve pelo menor índice, para dar sempre a mesma resposta ao mesmo
 * vetor. Devolve null quando a cultura é desconhecida ou quando o modelo não
 * deu massa nenhuma a ela - nesse caso não há resposta a dar, e inventar a
 * primeira classe da lista seria pior que admitir.
 */
export function prever(
  probabilidades: ArrayLike<number>,
  culturaId: string,
): Previsao | null {
  const mascarado = mascararPorCultura(probabilidades, culturaId);
  const indices = indicesDaCultura(culturaId);

  let melhor = -1;
  for (const i of indices) {
    if (melhor === -1 || mascarado[i] > mascarado[melhor]) melhor = i;
  }
  if (melhor === -1 || mascarado[melhor] <= 0) return null;

  const classe: ClasseModelo = CLASSES[melhor];
  return {
    classe: classe.classe,
    culturaId: classe.culturaId,
    doencaId: classe.doencaId,
    saudavel: classe.tipo === "saudavel",
    confianca: mascarado[melhor],
  };
}
