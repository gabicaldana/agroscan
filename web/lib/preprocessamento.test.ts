/**
 * Paridade de pixel entre a referência em Python e o porte.
 *
 * As imagens de teste são geradas por fórmula dos dois lados - nenhuma imagem
 * binária no repositório - e o tensor resultante tem que ter o mesmo digest
 * SHA-256 sobre os bytes float32. Um único valor diferente no último bit já
 * muda o digest, que é exatamente o rigor que se quer aqui: uma divergência
 * de pré-processamento não quebra nada, só faz o modelo receber uma imagem
 * diferente da do treino e errar com confiança.
 *
 * Rodar:  npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  gerarImagem,
  preprocessar,
  preprocessarRGB,
  tamanhoAposRedimensionar,
} from "./preprocessamento.ts";

const AQUI = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
  readFileSync(
    join(AQUI, "..", "..", "tests", "fixtures", "preprocessamento.json"),
    "utf8",
  ),
) as {
  casos: {
    padrao: string;
    largura: number;
    altura: number;
    apos_redimensionar: [number, number];
    esperado: {
      sha256: string;
      primeiros: number[];
      ultimos: number[];
      minimo: number;
      maximo: number;
      media: number;
    };
  }[];
};

const digest = (t: Float32Array) =>
  createHash("sha256").update(Buffer.from(t.buffer)).digest("hex");

const arredonda6 = (v: number) => Number(v.toFixed(6));

// Em laco, e nao `Math.min(...tensor)`: espalhar 150.528 argumentos estoura a
// pilha de chamada do Node.
const extremos = (t: Float32Array) => {
  let minimo = Infinity;
  let maximo = -Infinity;
  for (const v of t) {
    if (v < minimo) minimo = v;
    if (v > maximo) maximo = v;
  }
  return { minimo, maximo };
};

describe("paridade de pixel com o Python", () => {
  for (const caso of fixtures.casos) {
    test(`${caso.padrao} ${caso.largura}x${caso.altura}`, () => {
      const pixels = gerarImagem(caso.padrao, caso.largura, caso.altura);
      const tensor = preprocessarRGB(pixels, caso.largura, caso.altura);

      assert.deepEqual(
        tamanhoAposRedimensionar(caso.largura, caso.altura),
        caso.apos_redimensionar,
        "tamanho apos redimensionar",
      );
      assert.equal(tensor.length, 3 * 224 * 224);

      // Os valores soltos vêm antes do digest de propósito: quando algo
      // diverge, um digest diferente não diz nada, e estes dizem onde.
      assert.deepEqual(
        [...tensor.slice(0, 8)].map(arredonda6),
        caso.esperado.primeiros,
        "primeiros valores",
      );
      assert.deepEqual(
        [...tensor.slice(-8)].map(arredonda6),
        caso.esperado.ultimos,
        "ultimos valores",
      );
      const { minimo, maximo } = extremos(tensor);
      assert.equal(arredonda6(minimo), caso.esperado.minimo, "minimo");
      assert.equal(arredonda6(maximo), caso.esperado.maximo, "maximo");

      assert.equal(digest(tensor), caso.esperado.sha256, "digest do tensor");
    });
  }
});

describe("antisserrilhamento", () => {
  test("reduzir listras de 1 pixel vira cinza, e nao moire", () => {
    // Sem alargar o suporte do filtro, reduzir listras de 1 px por ~2,3x
    // amostraria uma listra sim outra não e produziria faixas largas que não
    // existem na imagem - e o modelo classificaria a textura inventada.
    const grande = preprocessarRGB(
      gerarImagem("listras", 800, 600),
      800,
      600,
    );
    const canalR = grande.subarray(0, 224 * 224);
    const media = canalR.reduce((a, b) => a + b, 0) / canalR.length;
    const desvio = Math.sqrt(
      canalR.reduce((a, b) => a + (b - media) ** 2, 0) / canalR.length,
    );
    assert.ok(desvio < 0.2, `deveria ficar quase uniforme, deu ${desvio}`);
  });

  test("ampliar as mesmas listras preserva o contraste", () => {
    // O contraponto: o filtro não pode simplesmente borrar tudo. Quando a
    // imagem só aumenta, o suporte não cresce e a listra continua listra.
    const pequena = preprocessarRGB(gerarImagem("listras", 101, 97), 101, 97);
    const canalR = pequena.subarray(0, 224 * 224);
    const media = canalR.reduce((a, b) => a + b, 0) / canalR.length;
    const desvio = Math.sqrt(
      canalR.reduce((a, b) => a + (b - media) ** 2, 0) / canalR.length,
    );
    assert.ok(desvio > 1.0, `deveria manter contraste, deu ${desvio}`);
  });
});

describe("entrada vinda do canvas", () => {
  test("RGBA e RGB dao o mesmo tensor", () => {
    const rgb = gerarImagem("gradiente", 300, 200);
    const rgba = new Uint8ClampedArray(300 * 200 * 4);
    for (let i = 0; i < 300 * 200; i++) {
      rgba[i * 4] = rgb[i * 3];
      rgba[i * 4 + 1] = rgb[i * 3 + 1];
      rgba[i * 4 + 2] = rgb[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }

    assert.equal(
      digest(preprocessar({ data: rgba, width: 300, height: 200 })),
      digest(preprocessarRGB(rgb, 300, 200)),
    );
  });

  test("o alfa e descartado, nao composto sobre fundo", () => {
    // Compor sobre branco mudaria o pixel de uma imagem com transparência, e
    // o modelo não teria como distinguir isso de uma folha clara.
    const opaca = new Uint8ClampedArray(10 * 10 * 4).fill(120);
    const transparente = new Uint8ClampedArray(10 * 10 * 4).fill(120);
    for (let i = 3; i < transparente.length; i += 4) transparente[i] = 0;

    assert.equal(
      digest(preprocessar({ data: opaca, width: 10, height: 10 })),
      digest(preprocessar({ data: transparente, width: 10, height: 10 })),
    );
  });

  test("imagem vazia ou truncada e erro, nao tensor de lixo", () => {
    assert.throws(() => preprocessarRGB(new Uint8Array(0), 0, 0), /vazia/);
    assert.throws(
      () => preprocessarRGB(new Uint8Array(10), 100, 100),
      /esperava 30000 valores RGB/,
    );
  });
});
