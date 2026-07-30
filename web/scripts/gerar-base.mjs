/**
 * Gera os modulos de dados do app a partir dos JSON do projeto:
 *
 *   data/base_conhecimento.json  ->  lib/base-conhecimento.ts
 *   data/contrato_modelo.json    ->  lib/contrato-modelo.ts
 *
 * Os dois JSON vivem fora de web/, porque sao do projeto e nao do app: o
 * Python os valida, carrega no SQLite e gera as fixtures a partir deles. O
 * app, por outro lado, precisa deles DENTRO do bundle - sao o conteudo do
 * laudo, e um app que busca o conteudo por rede nao funciona no meio do
 * talhao, que e o unico lugar onde ele precisa funcionar.
 *
 * Copiar a mao criaria duas fontes da verdade que divergem no primeiro
 * ajuste. Entao os arquivos sao gerados, e `npm test` confere que as copias
 * geradas batem com os JSON - se alguem editar a base e esquecer de regerar,
 * o teste quebra.
 *
 * Rodar:  npm run base
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const dados = (nome) => join(AQUI, "..", "..", "data", nome);
const saida = (nome) => join(AQUI, "..", "lib", nome);

export const CAMINHO_JSON_BASE = dados("base_conhecimento.json");
export const CAMINHO_JSON_CONTRATO = dados("contrato_modelo.json");
export const CAMINHO_SAIDA_BASE = saida("base-conhecimento.ts");
export const CAMINHO_SAIDA_CONTRATO = saida("contrato-modelo.ts");

/** snake_case -> camelCase, recursivo. Os JSON sao escritos na convencao do
 *  Python; o TypeScript le na dele. A conversao acontece num lugar so. */
export function paraCamel(valor) {
  if (Array.isArray(valor)) return valor.map(paraCamel);
  if (valor === null || typeof valor !== "object") return valor;

  return Object.fromEntries(
    Object.entries(valor).map(([chave, v]) => [
      chave.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase()),
      paraCamel(v),
    ]),
  );
}

const bloco = (nome, tipo, valor) =>
  `export const ${nome}: ${tipo} = ${JSON.stringify(valor, null, 2)};\n`;

const CABECALHO_BASE = `/**
 * GERADO AUTOMATICAMENTE por \`npm run base\` a partir de
 * data/base_conhecimento.json. Nao editar a mao: a proxima geracao
 * sobrescreve.
 *
 * O \`id\` da cultura e o nome curto usado no app. Ele NAO e necessariamente
 * o prefixo da classe no PlantVillage - \`prefixoModelo\` e quem carrega isso,
 * e os dois diferem em Cherry_(including_sour), Corn_(maize) e Pepper,_bell.
 * Quem precisa casar cultura com saida do modelo usa contrato-modelo.ts, que
 * ja traz os indices resolvidos.
 */

export type OrgaoId = "folha" | "caule" | "fruto" | "planta";
export type TipoTratamento = "cultural" | "biologico" | "quimico";
export type Gravidade = 1 | 2 | 3 | 4 | 5;

export type Orgao = {
  id: OrgaoId;
  /** Rotulo do grupo na tela de sintomas ("Na folha"). */
  rotulo: string;
  /** Ordem em que o agronomo olha a planta - nao e a ordem alfabetica. */
  ordem: number;
};

export type Sintoma = { id: string; nome: string; orgao: OrgaoId };

/** Peso de 0 a 1: 1.0 e o sintoma classico da doenca, 0.3 o ocasional. */
export type SintomaDoPerfil = { id: string; peso: number };

export type Tratamento = { tipo: TipoTratamento; descricao: string };

export type IngredienteAtivo = { nome: string; grupo: string; acao: string };

export type CondicoesFavoraveis = {
  temperatura: string;
  umidade: string;
  observacao: string;
};

export type Doenca = {
  id: string;
  /** Classe do PlantVillage, ou null quando o modelo nao a conhece. */
  classeModelo: string | null;
  nome: string;
  agente: string;
  tipoAgente: string;
  gravidade: Gravidade;
  descricao: string;
  sintomas: SintomaDoPerfil[];
  condicoesFavoraveis: CondicoesFavoraveis;
  tratamentos: Tratamento[];
  ingredientesAtivos: IngredienteAtivo[];
};

export type Cultura = {
  id: string;
  /** Prefixo desta cultura nas classes do PlantVillage. Difere do id em tres. */
  prefixoModelo: string;
  nome: string;
  nomeCientifico: string;
  emoji: string;
  doencas: Doenca[];
};

/** Uma das 12 classes "healthy" do dataset. Nao e doenca e nao tem sintomas:
 *  so existe para o modelo ter para onde apontar quando nao reconhece nada. */
export type ClasseSaudavel = {
  culturaId: string;
  classeModelo: string;
  /** So presente quando ha algo especifico daquela cultura a dizer. */
  observacao?: string;
};

export type CulturaSemClasseSaudavel = { culturaId: string; motivo: string };
`;

const CABECALHO_CONTRATO = `/**
 * GERADO AUTOMATICAMENTE por \`npm run base\` a partir de
 * data/contrato_modelo.json, que por sua vez e gerado por
 * \`python -m app.modelo\`. Nao editar a mao.
 *
 * Liga cada uma das 38 saidas do modelo de imagem a base de conhecimento.
 *
 * A ORDEM E COPIADA, NUNCA RECALCULADA. Nao existe nenhum \`sort\` de classes
 * neste lado do projeto, e nao pode passar a existir: a ordem canonica e
 * \`sorted()\` do Python, que ordena por ponto de codigo, e um \`localeCompare\`
 * ou um \`sort()\` padrao do JavaScript produziria outra. Trocar dois indices
 * faz o app responder a doenca errada, sempre da cultura certa, sem quebrar
 * tela nenhuma.
 */

export type TipoClasse = "doenca" | "saudavel";

export type ClasseModelo = {
  /** Posicao no vetor de saida do modelo. */
  indice: number;
  /** Rotulo do PlantVillage, com os erros de grafia do dataset preservados. */
  classe: string;
  culturaId: string;
  tipo: TipoClasse;
  /** Ficha que esta classe abre, ou null quando e uma classe saudavel. */
  doencaId: string | null;
};

export type Preprocessamento = {
  entrada: {
    largura: number;
    altura: number;
    canais: number;
    layout: string;
    tipo: string;
  };
  redimensionamento: {
    ladoMenor: number;
    recorte: string;
    metodo: string;
    cantosAlinhados: boolean;
  };
  normalizacao: { escala: number; media: number[]; desvio: number[] };
  saida: { tipo: string; classes: number };
};
`;

export function gerarFonteBase(
  json = JSON.parse(readFileSync(CAMINHO_JSON_BASE, "utf8")),
) {
  const base = paraCamel(json);
  return [
    CABECALHO_BASE,
    bloco("ORGAOS", "readonly Orgao[]", base.orgaos),
    bloco("SINTOMAS", "readonly Sintoma[]", base.sintomas),
    bloco("CULTURAS", "readonly Cultura[]", base.culturas),
    bloco("SAUDAVEIS", "readonly ClasseSaudavel[]", base.saudaveis),
    bloco(
      "CULTURAS_SEM_CLASSE_SAUDAVEL",
      "readonly CulturaSemClasseSaudavel[]",
      base.culturasSemClasseSaudavel,
    ),
  ].join("\n");
}

export function gerarFonteContrato(
  json = JSON.parse(readFileSync(CAMINHO_JSON_CONTRATO, "utf8")),
) {
  const contrato = paraCamel(json);
  return [
    CABECALHO_CONTRATO,
    bloco("TOTAL_DE_CLASSES", "number", contrato.totalDeClasses),
    bloco("CLASSES", "readonly ClasseModelo[]", contrato.classes),
    bloco(
      "POR_CULTURA",
      "Readonly<Record<string, readonly number[]>>",
      contrato.porCultura,
    ),
    bloco("PREPROCESSAMENTO", "Preprocessamento", contrato.preprocessamento),
    bloco(
      "ARQUIVO",
      "{ nome: string | null; sha256: string | null }",
      contrato.arquivo,
    ),
  ].join("\n");
}

const executadoDireto =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (executadoDireto) {
  writeFileSync(CAMINHO_SAIDA_BASE, gerarFonteBase(), "utf8");
  writeFileSync(CAMINHO_SAIDA_CONTRATO, gerarFonteContrato(), "utf8");

  const base = paraCamel(JSON.parse(readFileSync(CAMINHO_JSON_BASE, "utf8")));
  const contrato = JSON.parse(readFileSync(CAMINHO_JSON_CONTRATO, "utf8"));
  const doencas = base.culturas.flatMap((c) => c.doencas);
  console.log(`Gerado ${CAMINHO_SAIDA_BASE}`);
  console.log(
    `  ${base.culturas.length} culturas, ${doencas.length} doencas, ` +
      `${base.sintomas.length} sintomas`,
  );
  console.log(`Gerado ${CAMINHO_SAIDA_CONTRATO}`);
  console.log(`  ${contrato.classes.length} classes do modelo`);
}
