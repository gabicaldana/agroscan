/**
 * Testes da mascara por cultura, com vetores sinteticos.
 *
 * Nao existe modelo ainda, e e justamente esse o ponto: toda a interpretacao
 * da saida - mascara, renormalizacao, empate, cultura sem classe saudavel -
 * fica escrita e provada antes, para a fase 5 so ligar o ONNX na entrada.
 *
 * Rodar:  npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  CLASSES,
  POR_CULTURA,
  TOTAL_DE_CLASSES,
} from "./contrato-modelo.ts";
import { CULTURAS } from "./base-conhecimento.ts";
import {
  classeSaudavelDe,
  doencasForaDoModelo,
  foraDoModelo,
  indicesDaCultura,
  mascararPorCultura,
  motivoForaDoModelo,
  prever,
} from "./modelo.ts";

/** Vetor uniforme sobre as 38 classes: o pior caso, um modelo sem opiniao. */
function uniforme(): Float32Array {
  return new Float32Array(TOTAL_DE_CLASSES).fill(1 / TOTAL_DE_CLASSES);
}

/** Vetor com massa concentrada numa classe, pelo nome. */
function picoEm(classe: string, massa = 0.9): Float32Array {
  const alvo = CLASSES.findIndex((c) => c.classe === classe);
  assert.notEqual(alvo, -1, `classe inexistente no contrato: ${classe}`);

  const v = new Float32Array(TOTAL_DE_CLASSES).fill(
    (1 - massa) / (TOTAL_DE_CLASSES - 1),
  );
  v[alvo] = massa;
  return v;
}

const soma = (v: ArrayLike<number>) => {
  let t = 0;
  for (let i = 0; i < v.length; i++) t += v[i];
  return t;
};

describe("mascara por cultura", () => {
  test("o que sobra soma 1", () => {
    const m = mascararPorCultura(uniforme(), "Tomato");
    assert.ok(Math.abs(soma(m) - 1) < 1e-6, `somou ${soma(m)}`);
  });

  test("classes de outras culturas sao zeradas", () => {
    const m = mascararPorCultura(uniforme(), "Tomato");
    const doTomate = new Set(POR_CULTURA["Tomato"]);
    for (let i = 0; i < TOTAL_DE_CLASSES; i++) {
      if (!doTomate.has(i)) assert.equal(m[i], 0, `indice ${i} deveria zerar`);
    }
  });

  test("um pico numa doenca de outra cultura simplesmente some", () => {
    // O caso que a mascara existe para impedir: o agronomo fotografa tomate e
    // o modelo, sozinho, responderia requeima de BATATA.
    const v = picoEm("Potato___Late_blight");
    const m = mascararPorCultura(v, "Tomato");
    const iBatata = CLASSES.findIndex((c) => c.classe === "Potato___Late_blight");

    assert.equal(m[iBatata], 0);
    assert.equal(prever(v, "Potato")?.doencaId, "batata_requeima");
    assert.notEqual(prever(v, "Tomato")?.culturaId, "Potato");
  });

  test("um pico dentro da cultura continua lider e ganha confianca", () => {
    const v = picoEm("Tomato___Target_Spot", 0.6);
    const antes = v[CLASSES.findIndex((c) => c.classe === "Tomato___Target_Spot")];
    const previsao = prever(v, "Tomato");

    assert.equal(previsao?.doencaId, "tomate_mancha_alvo");
    assert.ok(
      previsao!.confianca > antes,
      "renormalizar dentro da cultura tem que subir a confianca da lider",
    );
  });

  test("cultura desconhecida nao quebra e nao inventa resposta", () => {
    assert.deepEqual(indicesDaCultura("Mandioca"), []);
    assert.equal(soma(mascararPorCultura(uniforme(), "Mandioca")), 0);
    assert.equal(prever(uniforme(), "Mandioca"), null);
  });

  test("vetor do tamanho errado e erro, nao resultado silencioso", () => {
    assert.throws(
      () => mascararPorCultura(new Float32Array(37), "Tomato"),
      /38 saidas, recebi 37/,
    );
  });

  test("massa zero na cultura nao vira NaN", () => {
    // Divisao por zero aqui espalharia NaN ate a tela, e NaN comparado com
    // qualquer coisa e falso: a UI mostraria uma barra vazia sem erro nenhum.
    const v = new Float32Array(TOTAL_DE_CLASSES);
    v[CLASSES.findIndex((c) => c.classe === "Apple___Apple_scab")] = 1;
    const m = mascararPorCultura(v, "Tomato");

    assert.ok(![...m].some(Number.isNaN));
    assert.equal(prever(v, "Tomato"), null);
  });

  test("empate resolve sempre pelo mesmo lado", () => {
    const primeira = prever(uniforme(), "Tomato");
    const segunda = prever(uniforme(), "Tomato");
    assert.deepEqual(primeira, segunda);
    assert.equal(primeira?.classe, "Tomato___Bacterial_spot", "menor indice");
  });
});

describe("classes saudaveis", () => {
  test("um pico na saudavel devolve saudavel, sem ficha", () => {
    const previsao = prever(picoEm("Tomato___healthy"), "Tomato");
    assert.equal(previsao?.saudavel, true);
    assert.equal(previsao?.doencaId, null);
  });

  test("laranja e abobora nao tem classe saudavel", () => {
    // O dataset nao traz essas duas. Codigo que assuma que toda cultura tem
    // uma classe saudavel quebraria aqui - e para citros isso importa: o
    // modelo NUNCA consegue responder "sem doenca" para laranja.
    assert.equal(classeSaudavelDe("Orange"), null);
    assert.equal(classeSaudavelDe("Squash"), null);
    assert.equal(classeSaudavelDe("Tomato")?.classeModelo, "Tomato___healthy");

    for (const cultura of ["Orange", "Squash"]) {
      const tipos = indicesDaCultura(cultura).map((i) => CLASSES[i].tipo);
      assert.ok(!tipos.includes("saudavel"));
    }
  });

  test("laranja so tem uma saida, e ela e sempre a resposta", () => {
    const previsao = prever(uniforme(), "Orange");
    assert.equal(previsao?.doencaId, "laranja_greening");
    assert.equal(previsao?.confianca, 1);
  });

  test("cultura sem doenca so pode responder saudavel", () => {
    for (const cultura of ["Blueberry", "Raspberry"]) {
      const previsao = prever(uniforme(), cultura);
      assert.equal(previsao?.saudavel, true, cultura);
      assert.equal(previsao?.confianca, 1, cultura);
    }
  });

  test("a soja avisa que o modelo nao ve as doencas dela", () => {
    // O ponto cego mais perigoso do app: o modelo so conhece soja saudavel,
    // entao ferrugem asiatica apontada para ele cai aqui com confianca alta.
    const soja = classeSaudavelDe("Soybean");
    assert.match(soja?.observacao ?? "", /ferrugem asiática/i);
  });
});

describe("cobertura do contrato", () => {
  test("a mascara tem as 14 culturas do dataset, e so elas", () => {
    // Nao e "toda cultura da base": a base tem 17, porque cana, cafe e
    // algodao entraram por serem lavouras centrais no Brasil. O dataset
    // continua com 14, e a mascara e do dataset.
    assert.equal(Object.keys(POR_CULTURA).length, 14);
    assert.equal(CULTURAS.length, 17);
  });

  test("cada indice pertence a exatamente uma cultura", () => {
    const todos = Object.values(POR_CULTURA).flat().sort((a, b) => a - b);
    assert.deepEqual(
      todos,
      Array.from({ length: TOTAL_DE_CLASSES }, (_, i) => i),
    );
  });
});

describe("culturas que o dataset nao contem", () => {
  const FORA = ["Sugarcane", "Coffee", "Cotton"];

  test("as tres sao reconhecidas como fora do modelo", () => {
    for (const id of FORA) assert.equal(foraDoModelo(id), true, id);
  });

  test("cultura coberta e cultura inexistente nao sao fora do modelo", () => {
    assert.equal(foraDoModelo("Tomato"), false);
    // Blueberry o modelo cobre - so nao tem doenca cadastrada, que e outra
    // coisa. Confundir as duas tiraria o mirtilo da camera sem motivo.
    assert.equal(foraDoModelo("Blueberry"), false);
    assert.equal(foraDoModelo("Manga"), false, "inexistente nao e 'fora'");
  });

  test("cada uma explica por que, com texto vindo da base", () => {
    for (const id of FORA) {
      const motivo = motivoForaDoModelo(id) ?? "";
      assert.ok(motivo.length > 40, `${id} sem motivo curado`);
      assert.match(motivo, /PlantVillage/);
    }
    assert.equal(motivoForaDoModelo("Tomato"), null);
  });

  test("a lista de indices vazia NAO serve para distinguir os dois casos", () => {
    // Este teste existe para travar a tentacao de usar
    // `indicesDaCultura(id).length === 0` como checagem: ele da zero tanto
    // para cana quanto para uma cultura que nao existe, e as duas situacoes
    // pedem respostas opostas do app.
    assert.deepEqual(indicesDaCultura("Sugarcane"), []);
    assert.deepEqual(indicesDaCultura("Manga"), []);
    assert.notEqual(foraDoModelo("Sugarcane"), foraDoModelo("Manga"));
  });

  test("nenhuma delas tem classe saudavel para o modelo apontar", () => {
    for (const id of FORA) assert.equal(classeSaudavelDe(id), null, id);
  });

  test("todas as doencas delas estao fora do alcance do modelo", () => {
    for (const id of FORA) {
      const cultura = CULTURAS.find((c) => c.id === id)!;
      assert.ok(cultura.doencas.length > 0, `${id} sem doenca cadastrada`);
      assert.equal(doencasForaDoModelo(id).length, cultura.doencas.length);
      assert.equal(cultura.prefixoModelo, null);
    }
  });

  test("mascarar por elas nao inventa resposta nem espalha NaN", () => {
    const mascarado = mascararPorCultura(uniforme(), "Sugarcane");
    assert.equal(mascarado.length, TOTAL_DE_CLASSES);
    assert.ok(mascarado.every((v) => v === 0), "tudo zero, nenhum NaN");
    assert.equal(prever(uniforme(), "Sugarcane"), null);
  });
});
