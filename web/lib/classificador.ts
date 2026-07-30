/**
 * A costura do modelo de imagem.
 *
 * Hoje ela é um buraco declarado: `ARQUIVO.nome` é null no contrato porque o
 * treino da fase 4b ainda não rodou. Este módulo existe para que o buraco
 * tenha uma forma, um erro nomeado e um teste - em vez de o resto do app ser
 * escrito em volta de uma suposição.
 *
 * Quando o ONNX chegar, `carregarClassificador` passa a devolver um objeto que
 * roda o grafo; nada mais no app muda, porque tudo depende desta interface e
 * não do runtime.
 *
 * A verificação da lista de classes não é zelo excessivo. O cenário provável
 * neste app é o service worker servir um modelo antigo em cache junto de um
 * bundle novo: os dois carregam, a inferência roda, e cada índice aponta para
 * a doença errada. Nenhuma tela quebra. Por isso o modelo carrega a lista de
 * classes no próprio arquivo e o carregador recusa rodar se ela não bater.
 */

import { ARQUIVO, CLASSES, TOTAL_DE_CLASSES } from "./contrato-modelo.ts";

/** Um classificador devolve os LOGITS CRUS, nunca probabilidades.
 *
 *  A recusa precisa de temperatura e energia, e as duas são impossíveis de
 *  calcular depois que o softmax já foi aplicado. */
export type Classificador = {
  /** @param tensor NCHW float32, 1×3×224×224, vindo de `preprocessamento.ts` */
  classificar(tensor: Float32Array): Promise<Float32Array>;
};

export class ModeloIndisponivel extends Error {
  // Sem `constructor(readonly detalhe)`: o Node so REMOVE tipos, nao
  // transforma codigo, e propriedade declarada no parametro exigiria gerar o
  // `this.detalhe = detalhe`. Escrevendo a mao, `node --test` roda o arquivo
  // direto e o projeto continua sem dependencia de build nos testes.
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ModeloIndisponivel";
  }
}

/** Há um modelo declarado no contrato? */
export function modeloDisponivel(): boolean {
  return ARQUIVO.nome !== null && ARQUIVO.sha256 !== null;
}

/**
 * Confere que a lista de classes gravada no modelo é a do contrato.
 *
 * Exportada e testável separadamente porque é a única defesa contra o modelo
 * em cache divergir do bundle - e um teste que só rode quando existir um ONNX
 * de verdade seria um teste que nunca roda.
 */
export function conferirClasses(classesDoModelo: readonly string[]): void {
  if (classesDoModelo.length !== TOTAL_DE_CLASSES) {
    throw new ModeloIndisponivel(
      `o modelo declara ${classesDoModelo.length} classes, o app espera ` +
        `${TOTAL_DE_CLASSES}`,
    );
  }
  for (let i = 0; i < TOTAL_DE_CLASSES; i++) {
    if (classesDoModelo[i] !== CLASSES[i].classe) {
      throw new ModeloIndisponivel(
        `classe ${i} diverge: o modelo diz "${classesDoModelo[i]}", o app ` +
          `espera "${CLASSES[i].classe}"`,
      );
    }
  }
}

/**
 * Carrega o classificador, ou explica por que não dá.
 *
 * Devolve `null` - e não lança - quando simplesmente ainda não existe modelo:
 * é um estado previsto do produto nesta fase, não uma falha. A interface
 * mostra o fluxo por sintomas nesse caso.
 */
export async function carregarClassificador(): Promise<Classificador | null> {
  if (!modeloDisponivel()) return null;

  // Fase 4b entrega o ONNX; aqui entram o onnxruntime-web, a leitura de
  // `metadata_props.classes` e a chamada a `conferirClasses`.
  throw new ModeloIndisponivel(
    `o contrato declara o modelo "${ARQUIVO.nome}", mas o runtime de ` +
      `inferencia ainda nao foi ligado`,
  );
}
