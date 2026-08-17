/**
 * A camada 1 do app, ponta a ponta: foto -> laudo.
 *
 *   pixels da câmera
 *     -> preprocessamento.ts   (tensor idêntico ao do treino)
 *     -> classificador.ts      (logits crus)
 *     -> recusa.ts             (decidir sobre os logits CRUS)
 *     -> modelo.ts             (máscara por cultura, e só então a resposta)
 *
 * A ordem entre recusa e máscara não é negociável: a máscara infla a
 * confiança de qualquer imagem, então recusar depois dela seria nunca recusar.
 * Está escrito assim aqui, num lugar só, para nenhuma tela poder inverter.
 *
 * Recebe o classificador por parâmetro em vez de carregá-lo: é o que permite
 * testar toda a orquestração com um classificador falso, hoje, sem modelo.
 */

import type { Classificador } from "./classificador.ts";
import { preprocessar } from "./preprocessamento.ts";
import { avaliar, softmax, type Pontuacoes } from "./recusa.ts";
import { foraDoModelo, motivoForaDoModelo, prever, type Previsao } from "./modelo.ts";

export type ImagemCapturada = {
  data: ArrayLike<number>;
  width: number;
  height: number;
};

export type ResultadoDaImagem =
  /**
   * O dataset não contém esta cultura - cana, café, algodão. Diferente de
   * `sem_modelo`: aqui não há o que esperar, porque nenhum treino do
   * PlantVillage vai criar uma classe de cana.
   */
  | { estado: "cultura_fora_do_modelo"; culturaId: string; motivo: string }
  /** Nenhum modelo carregado - estado normal enquanto a fase 4b não roda. */
  | { estado: "sem_modelo" }
  /** O modelo respondeu, mas não reconheceu nada do domínio treinado. */
  | { estado: "recusado"; motivo: string; pontuacoes: Pontuacoes }
  /** Respondeu, mas os limiares de recusa ainda não foram medidos. */
  | { estado: "nao_calibrado"; previsao: Previsao; pontuacoes: Pontuacoes }
  /** Cultura sem massa nenhuma: nem a máscara consegue formar resposta. */
  | { estado: "sem_resposta"; pontuacoes: Pontuacoes }
  | { estado: "diagnosticado"; previsao: Previsao; pontuacoes: Pontuacoes };

export async function diagnosticarImagem(
  imagem: ImagemCapturada,
  culturaId: string,
  classificador: Classificador | null,
): Promise<ResultadoDaImagem> {
  // Antes de tudo, inclusive antes de checar se há modelo carregado. Se a
  // cultura está fora do dataset, "o modelo ainda não existe" seria uma
  // meia-verdade que sugere esperar a fase 4b - e esperar não resolve. Também
  // evita preprocessar uma foto cujo resultado já se sabe inútil.
  if (foraDoModelo(culturaId)) {
    return {
      estado: "cultura_fora_do_modelo",
      culturaId,
      motivo: motivoForaDoModelo(culturaId) ?? "",
    };
  }

  if (!classificador) return { estado: "sem_modelo" };

  const tensor = preprocessar(imagem);
  const logitsCrus = await classificador.classificar(tensor);

  // Sobre os logits CRUS, antes da máscara. Ver recusa.ts.
  const veredito = avaliar(logitsCrus);
  if (veredito.decisao === "recusar") {
    return {
      estado: "recusado",
      motivo: veredito.motivo,
      pontuacoes: veredito.pontuacoes,
    };
  }

  const previsao = prever(softmax(logitsCrus), culturaId);
  if (!previsao) {
    return { estado: "sem_resposta", pontuacoes: veredito.pontuacoes };
  }

  return {
    estado: veredito.decisao === "nao_calibrado" ? "nao_calibrado" : "diagnosticado",
    previsao,
    pontuacoes: veredito.pontuacoes,
  };
}

/** Para onde a interface manda o usuário depois de um resultado aceito. */
export function rotaDoLaudo(previsao: Previsao): string {
  const confianca = Math.round(previsao.confianca * 100);
  return previsao.saudavel
    ? `/resultado?saudavel=${previsao.culturaId}&confianca=${confianca}`
    : `/resultado?doenca=${previsao.doencaId}&confianca=${confianca}`;
}
