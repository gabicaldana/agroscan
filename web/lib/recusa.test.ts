/**
 * Testes da recusa.
 *
 * Rodar:  npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { CLASSES, RECUSA, TOTAL_DE_CLASSES } from "./contrato-modelo.ts";
import { mascararPorCultura } from "./modelo.ts";
import { avaliar, estaCalibrado, pontuar, softmax } from "./recusa.ts";

/** Logits com um pico numa classe: um modelo seguro do que viu. */
function logitsCom(classe: string, altura = 12): Float32Array {
  const v = new Float32Array(TOTAL_DE_CLASSES);
  v[CLASSES.findIndex((c) => c.classe === classe)] = altura;
  return v;
}

const soma = (v: ArrayLike<number>) => {
  let t = 0;
  for (let i = 0; i < v.length; i++) t += v[i];
  return t;
};

describe("softmax", () => {
  test("soma 1", () => {
    assert.ok(Math.abs(soma(softmax(logitsCom("Tomato___Early_blight"))) - 1) < 1e-12);
  });

  test("nao estoura com logit gigante", () => {
    // Sem subtrair o maximo antes de exponenciar, Math.exp(800) e Infinity e
    // o softmax inteiro vira NaN - que compararia falso com qualquer limiar
    // e faria a recusa nunca disparar, em silencio.
    const p = softmax(logitsCom("Tomato___Early_blight", 800));
    assert.ok(![...p].some(Number.isNaN), "nao pode ter NaN");
    assert.ok(Math.abs(soma(p) - 1) < 1e-12);
  });

  test("temperatura maior achata a distribuicao", () => {
    const logits = logitsCom("Tomato___Early_blight", 6);
    const quente = pontuarCom(logits, 4);
    const fria = pontuarCom(logits, 1);
    assert.ok(quente < fria, "temperatura alta tem que reduzir a confianca");
  });

  test("temperatura invalida e erro", () => {
    assert.throws(() => softmax([1, 2, 3], 0), /positiva/);
    assert.throws(() => softmax([1, 2, 3], -1), /positiva/);
  });
});

function pontuarCom(logits: ArrayLike<number>, temperatura: number): number {
  const p = softmax(logits, temperatura);
  return Math.max(...p);
}

describe("pontuacoes sobre os logits crus", () => {
  test("modelo seguro pontua alto, modelo indeciso pontua baixo", () => {
    const seguro = pontuar(logitsCom("Tomato___Early_blight", 12));
    const indeciso = pontuar(new Float32Array(TOTAL_DE_CLASSES)); // tudo zero

    assert.ok(seguro.msp > 0.99, `msp seguro deu ${seguro.msp}`);
    assert.ok(
      Math.abs(indeciso.msp - 1 / TOTAL_DE_CLASSES) < 1e-9,
      "uniforme tem que dar 1/38",
    );
    assert.ok(seguro.margem > indeciso.margem);
    assert.ok(
      seguro.energia < indeciso.energia,
      "energia menor = o modelo reconhece melhor",
    );
  });

  test("sem logits e erro", () => {
    assert.throws(() => pontuar([]), /sem logits/);
  });
});

describe("a mascara destroi a confianca como sinal de recusa", () => {
  test("a confianca mascarada tem piso, e o piso nao depende da imagem", () => {
    // ESTE e o teste que justifica o desenho inteiro do modulo.
    //
    // Uma mangueira fotografada com "tomate" selecionado produz logits quase
    // uniformes: o modelo nao reconhece nada, e a MSP crua denuncia isso
    // caindo para 1/38. Mas a mascara renormaliza sobre as dez classes de
    // tomate, e a lider nao consegue ficar abaixo de 1/10 - por pior que seja
    // a foto. O numero mascarado mede como o modelo divide a cultura, nao o
    // quanto ele reconheceu a imagem, e por isso nao serve de sinal de recusa.
    const logitsCrus = new Float32Array(TOTAL_DE_CLASSES); // tudo zero
    const cru = pontuar(logitsCrus);

    const mascarado = mascararPorCultura(softmax(logitsCrus), "Tomato");
    let maiorMascarado = 0;
    for (const v of mascarado) if (v > maiorMascarado) maiorMascarado = v;

    const classesDeTomate = [...mascarado].filter((v) => v > 0).length;
    assert.equal(classesDeTomate, 10);

    assert.ok(cru.msp < 0.03, `a MSP crua denuncia: ${cru.msp}`);
    assert.ok(
      maiorMascarado >= 1 / classesDeTomate - 1e-6,
      `o piso da mascara e 1/${classesDeTomate}, deu ${maiorMascarado}`,
    );
    assert.ok(
      maiorMascarado / cru.msp > 3,
      "a mascara infla a confianca de uma imagem irreconhecivel",
    );
  });

  test("para laranja a mascara leva a confianca a 1, sempre", () => {
    // Caso extremo e real: laranja tem UMA classe. Qualquer imagem apontada
    // como laranja sai com 100% de confianca depois da mascara, inclusive uma
    // folha de cafe. So a pontuacao crua pode recusar.
    const mascarado = mascararPorCultura(
      softmax(new Float32Array(TOTAL_DE_CLASSES)),
      "Orange",
    );
    assert.equal(Math.max(...mascarado), 1);
    assert.ok(pontuar(new Float32Array(TOTAL_DE_CLASSES)).msp < 0.03);
  });
});

describe("estado de calibracao", () => {
  test("sem limiares medidos, o app nao finge que decide", () => {
    // Enquanto a fase 4b nao rodar, o contrato traz limiares nulos. Aceitar
    // tudo seria pior que nao ter recusa: o agronomo veria um app que diz
    // "verifiquei" sem ter verificado nada.
    assert.equal(RECUSA.temperatura, null);
    assert.equal(RECUSA.limiarMsp, null);
    assert.equal(estaCalibrado(), false);

    const veredito = avaliar(logitsCom("Tomato___Early_blight"));
    assert.equal(veredito.decisao, "nao_calibrado");
    assert.ok(veredito.pontuacoes.msp > 0.99, "as pontuacoes existem mesmo assim");
  });

  test("o contrato lembra onde medir, e nao e depois da mascara", () => {
    assert.match(RECUSA.medirSobre, /LOGITS CRUS/);
    assert.equal(RECUSA.saboresDeForaDaDistribuicao.length, 3);
    // O ultimo e o mais perigoso: cultura que o modelo conhece, doenca que
    // ele nao conhece. E o unico que nenhuma checagem de cultura pega.
    assert.match(RECUSA.saboresDeForaDaDistribuicao[2], /soja/);
  });
});
