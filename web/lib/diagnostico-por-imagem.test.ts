/**
 * Testes da orquestracao foto -> laudo, com classificador falso.
 *
 * A costura existe justamente para isto: o fluxo inteiro fica provado hoje,
 * sem modelo, e a fase 4b so troca quem devolve os logits.
 *
 * Rodar:  npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { CLASSES, TOTAL_DE_CLASSES } from "./contrato-modelo.ts";
import {
  conferirClasses,
  modeloDisponivel,
  carregarClassificador,
  type Classificador,
} from "./classificador.ts";
import {
  diagnosticarImagem,
  rotaDoLaudo,
  type ImagemCapturada,
} from "./diagnostico-por-imagem.ts";

/** Classificador falso: devolve os logits que o teste mandar. */
function classificadorQueDevolve(logits: Float32Array): Classificador {
  return {
    async classificar(tensor) {
      assert.equal(tensor.length, 3 * 224 * 224, "tensor NCHW 3x224x224");
      return logits;
    },
  };
}

function logitsCom(classe: string, altura = 12): Float32Array {
  const v = new Float32Array(TOTAL_DE_CLASSES);
  v[CLASSES.findIndex((c) => c.classe === classe)] = altura;
  return v;
}

const foto = (): ImagemCapturada => ({
  data: new Uint8ClampedArray(64 * 48 * 4).fill(140),
  width: 64,
  height: 48,
});

describe("o modelo ainda nao existe, e isso e um estado previsto", () => {
  test("o contrato nao declara arquivo de modelo", () => {
    assert.equal(modeloDisponivel(), false);
  });

  test("carregar devolve null, e nao explode", () => {
    // Nao ter modelo nesta fase e produto, nao falha: a tela oferece o fluxo
    // por sintomas em vez de mostrar erro.
    return carregarClassificador().then((c) => assert.equal(c, null));
  });

  test("sem classificador o fluxo para antes de preprocessar", async () => {
    const r = await diagnosticarImagem(foto(), "Tomato", null);
    assert.deepEqual(r, { estado: "sem_modelo" });
  });
});

describe("conferencia da lista de classes", () => {
  const corretas = CLASSES.map((c) => c.classe);

  test("aceita a lista do contrato", () => {
    conferirClasses(corretas);
  });

  test("recusa contagem diferente", () => {
    assert.throws(() => conferirClasses(corretas.slice(0, 37)), /37 classes/);
  });

  test("recusa duas classes trocadas de lugar", () => {
    // O cenario real: service worker servindo um ONNX antigo junto de um
    // bundle novo. Os dois carregam, a inferencia roda, e cada indice aponta
    // para a doenca errada - sem quebrar tela nenhuma.
    const trocadas = [...corretas];
    [trocadas[29], trocadas[30]] = [trocadas[30], trocadas[29]];
    assert.throws(() => conferirClasses(trocadas), /classe 29 diverge/);
  });
});

describe("fluxo completo com classificador falso", () => {
  test("pico numa doenca vira laudo daquela doenca", async () => {
    const r = await diagnosticarImagem(
      foto(),
      "Tomato",
      classificadorQueDevolve(logitsCom("Tomato___Early_blight")),
    );

    assert.equal(r.estado, "nao_calibrado", "sem limiares medidos ainda");
    assert.equal(r.previsao.doencaId, "tomate_pinta_preta");
    assert.ok(r.pontuacoes.msp > 0.99);
    assert.equal(
      rotaDoLaudo(r.previsao),
      "/resultado?doenca=tomate_pinta_preta&confianca=100",
    );
  });

  test("pico numa classe saudavel vira o laudo saudavel", async () => {
    const r = await diagnosticarImagem(
      foto(),
      "Tomato",
      classificadorQueDevolve(logitsCom("Tomato___healthy")),
    );

    assert.equal(r.estado, "nao_calibrado");
    assert.equal(r.previsao.saudavel, true);
    assert.match(rotaDoLaudo(r.previsao), /^\/resultado\?saudavel=Tomato/);
  });

  test("a mascara impede o modelo de responder doenca de outra cultura", async () => {
    // O modelo tem certeza de que e requeima de BATATA. O agronomo disse que
    // plantou tomate. A resposta nao pode ser batata.
    const r = await diagnosticarImagem(
      foto(),
      "Tomato",
      classificadorQueDevolve(logitsCom("Potato___Late_blight")),
    );

    assert.equal(r.estado, "nao_calibrado");
    assert.equal(r.previsao.culturaId, "Tomato");
    assert.notEqual(r.previsao.doencaId, "batata_requeima");
  });

  test("o tensor chega com o tamanho certo, qualquer que seja a foto", async () => {
    // O assert vive dentro do classificador falso; aqui so variamos a entrada.
    for (const [w, h] of [
      [64, 48],
      [1080, 1920],
      [224, 224],
    ]) {
      const imagem = {
        data: new Uint8ClampedArray(w * h * 4).fill(200),
        width: w,
        height: h,
      };
      const r = await diagnosticarImagem(
        imagem,
        "Tomato",
        classificadorQueDevolve(logitsCom("Tomato___Leaf_Mold")),
      );
      assert.equal(r.estado, "nao_calibrado");
    }
  });

  test("cultura sem massa nenhuma admite que nao ha resposta", async () => {
    // Todo o peso num indice de maca, com "tomate" selecionado: depois da
    // mascara nao sobra probabilidade nenhuma. Inventar a primeira classe da
    // lista seria pior que admitir.
    const logits = new Float32Array(TOTAL_DE_CLASSES).fill(-1000);
    logits[CLASSES.findIndex((c) => c.classe === "Apple___Apple_scab")] = 50;

    const r = await diagnosticarImagem(
      foto(),
      "Tomato",
      classificadorQueDevolve(logits),
    );
    assert.equal(r.estado, "sem_resposta");
  });
});
