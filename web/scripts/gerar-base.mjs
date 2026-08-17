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
  /**
   * Prefixo desta cultura nas classes do PlantVillage. Difere do id em tres.
   *
   * \`null\` quando o dataset nao contem a cultura de forma alguma - cana, cafe
   * e algodao, que entraram na base por serem lavouras centrais no Brasil.
   * Quem precisa saber se o modelo cobre uma cultura NAO deve testar este
   * campo: use \`foraDoModelo\` em modelo.ts, que le a lista do contrato.
   */
  prefixoModelo: string | null;
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

/** Cultura que existe no dataset, mas sem a classe "healthy" - laranja e
 *  abobora. O modelo responde por ela, mas nunca "sem doenca". */
export type CulturaSemClasseSaudavel = { culturaId: string; motivo: string };

/**
 * Cultura que o PlantVillage NAO CONTEM - nem doente, nem saudavel.
 *
 * Nao confundir com \`CulturaSemClasseSaudavel\`: la o modelo responde e so nao
 * sabe dizer "saudavel"; aqui ele nao tem saida nenhuma, e esperar a fase 4b
 * nao muda isso. O \`motivo\` e o que o app mostra ao agronomo, para a ausencia
 * nao parecer falha do aplicativo.
 */
export type CulturaForaDoModelo = { culturaId: string; motivo: string };
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
 *
 * \`POR_CULTURA\` so tem as culturas que o modelo cobre. As de
 * \`IDS_FORA_DO_MODELO\` estao AUSENTES dele de proposito, e nao presentes com
 * lista vazia: uma lista vazia seria indistinguivel de cultura inexistente, e
 * as duas pedem respostas diferentes - uma e bug, a outra e um fato que o
 * agronomo precisa ouvir antes de tirar a foto.
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

/**
 * Limiares de recusa. Nulos ate a fase 4b medir a curva risco-cobertura:
 * chutar um numero daria ao agronomo uma recusa que nao significa nada.
 */
export type Recusa = {
  temperatura: number | null;
  limiarMsp: number | null;
  limiarEnergia: number | null;
  calibradoEm: string | null;
  /** Lembrete de que a pontuacao vai sobre os logits CRUS, antes da mascara. */
  medirSobre: string;
  saboresDeForaDaDistribuicao: string[];
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
    bloco(
      "CULTURAS_FORA_DO_MODELO",
      "readonly CulturaForaDoModelo[]",
      base.culturasForaDoModelo,
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
    bloco(
      "IDS_FORA_DO_MODELO",
      "readonly string[]",
      contrato.culturasForaDoModelo,
    ),
    bloco("PREPROCESSAMENTO", "Preprocessamento", contrato.preprocessamento),
    bloco("RECUSA", "Recusa", contrato.recusa),
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
