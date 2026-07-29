/**
 * O porte em TypeScript tem que reproduzir o motor de referencia em Python.
 *
 * Rodar:  npm test   (usa o runner nativo do Node, sem dependencia nenhuma)
 *
 * O arquivo tests/fixtures/casos_diagnostico.json e gerado pelo Python
 * (`python -m app.fixtures`) e versionado. Aqui ele e a fonte da verdade: se
 * um unico campo divergir, o teste falha e diz qual caso e qual campo.
 *
 * Sao 76 casos, incluindo perfil completo e sintoma isolado de cada uma das
 * 29 doencas da base. Mexer num peso da base sem regerar as fixtures quebra
 * os dois lados - que e exatamente o objetivo.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { paraCamel, gerarFonte, CAMINHO_SAIDA } from "../scripts/gerar-base.mjs";
import {
  chaveAlfabetica,
  detalharDoenca,
  diagnosticar,
  listarCulturas,
  listarSintomasDaCultura,
  melhorPergunta,
  type Hipotese,
} from "./diagnostico.ts";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CAMINHO_FIXTURES = join(
  AQUI,
  "..",
  "..",
  "tests",
  "fixtures",
  "casos_diagnostico.json",
);

type Fixtures = {
  culturas: unknown[];
  catalogos: { cultura: string; sintomas: unknown[] }[];
  fichas: { id: string }[];
  casos: {
    nome: string;
    cultura: string;
    sintomas: string[];
    esperado: { hipoteses: Hipotese[]; pergunta: unknown };
  }[];
};

const fixtures: Fixtures = paraCamel(
  JSON.parse(readFileSync(CAMINHO_FIXTURES, "utf8")),
);

describe("paridade com o motor de referencia em Python", () => {
  for (const caso of fixtures.casos) {
    test(`${caso.nome} [${caso.cultura}: ${caso.sintomas.join(", ") || "-"}]`, () => {
      const hipoteses = diagnosticar(caso.cultura, caso.sintomas);

      // Compara doenca a doenca antes do assert do conjunto inteiro: um
      // deepEqual de 5 hipoteses aninhadas produz um diff ilegivel, e o que
      // se quer saber e QUAL doenca e QUAL campo divergiu.
      assert.deepEqual(
        hipoteses.map((h) => h.doencaId),
        caso.esperado.hipoteses.map((h) => h.doencaId),
        "ordem ou conjunto de hipoteses diferente do Python",
      );

      for (const [i, esperada] of caso.esperado.hipoteses.entries()) {
        assert.equal(
          hipoteses[i].compatibilidade,
          esperada.compatibilidade,
          `compatibilidade de ${esperada.doencaId}`,
        );
        assert.deepEqual(hipoteses[i], esperada, `hipotese ${esperada.doencaId}`);
      }

      assert.deepEqual(
        melhorPergunta(hipoteses) ?? null,
        caso.esperado.pergunta ?? null,
        "pergunta de desempate",
      );
    });
  }

  test("lista de culturas com doenca cadastrada", () => {
    assert.deepEqual(listarCulturas(true), fixtures.culturas);
  });

  for (const { cultura, sintomas } of fixtures.catalogos) {
    test(`catalogo de sintomas de ${cultura}`, () => {
      assert.deepEqual(listarSintomasDaCultura(cultura), sintomas);
    });
  }

  for (const ficha of fixtures.fichas) {
    test(`ficha de ${ficha.id}`, () => {
      assert.deepEqual(detalharDoenca(ficha.id), ficha);
    });
  }
});

describe("base gerada", () => {
  test("lib/base-conhecimento.ts esta atualizado com o JSON curado", () => {
    assert.equal(
      readFileSync(CAMINHO_SAIDA, "utf8"),
      gerarFonte(),
      "A base curada mudou e o modulo gerado nao. Rode `npm run base`.",
    );
  });
});

describe("comportamento proprio do porte", () => {
  test("cultura desconhecida nao quebra, so nao devolve nada", () => {
    assert.deepEqual(diagnosticar("Mandioca", ["manchas_amareladas"]), []);
    assert.deepEqual(listarSintomasDaCultura("Mandioca"), []);
  });

  test("doenca desconhecida levanta erro", () => {
    assert.throws(() => detalharDoenca("nao_existe"), /doenca desconhecida/);
  });

  test("aceita qualquer iteravel de sintomas, nao so array", () => {
    const comSet = diagnosticar("Tomato", new Set(["manchas_escuras_aneis"]));
    const comArray = diagnosticar("Tomato", ["manchas_escuras_aneis"]);
    assert.deepEqual(comSet, comArray);
  });

  test("sintoma repetido na entrada nao conta duas vezes", () => {
    const repetido = diagnosticar("Tomato", [
      "manchas_escuras_aneis",
      "manchas_escuras_aneis",
    ]);
    const unico = diagnosticar("Tomato", ["manchas_escuras_aneis"]);
    assert.deepEqual(repetido, unico);
  });

  test("acento nao joga o sintoma para o fim da lista", () => {
    const nomes = listarSintomasDaCultura("Tomato").map((s) => s.nome);
    const comAcaros = nomes.indexOf("Ácaros minúsculos na face inferior (visíveis com lupa)");
    assert.equal(comAcaros, 0, "'Ácaros' deveria abrir a lista da folha");
    assert.equal(chaveAlfabetica("Pêssego") < chaveAlfabetica("Pimentão"), true);
  });
});
