/**
 * Gera lib/base-conhecimento.ts a partir de data/base_conhecimento.json.
 *
 * A base curada vive fora de web/, porque ela e do projeto e nao do app: o
 * Python a valida, carrega no SQLite e gera as fixtures a partir dela. O app,
 * por outro lado, precisa da base DENTRO do bundle - ela e o conteudo do
 * laudo, e um app que busca o conteudo por rede nao funciona no meio do
 * talhao, que e o unico lugar onde ele precisa funcionar.
 *
 * Copiar a mao criaria duas fontes da verdade que divergem no primeiro
 * ajuste de peso. Entao o arquivo e gerado, e `npm test` confere que a copia
 * gerada bate com o JSON - se alguem editar a base e esquecer de regerar, o
 * teste quebra.
 *
 * Rodar:  npm run base
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
export const CAMINHO_JSON = join(AQUI, "..", "..", "data", "base_conhecimento.json");
export const CAMINHO_SAIDA = join(AQUI, "..", "lib", "base-conhecimento.ts");

/** snake_case -> camelCase, recursivo. O JSON e escrito na convencao do
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

const CABECALHO = `/**
 * GERADO AUTOMATICAMENTE por \`npm run base\` a partir de
 * data/base_conhecimento.json. Nao editar a mao: a proxima geracao
 * sobrescreve.
 *
 * Os ids das culturas sao os prefixos das classes do PlantVillage
 * (\`Tomato\`, \`Corn\`), porque e por eles que a mascara por cultura vai
 * zerar as saidas irrelevantes do modelo na fase 5. \`classeModelo\` liga
 * cada doenca a sua classe; \`null\` significa que o modelo nao sabe
 * reconhece-la e so o fluxo por sintomas chega ate ela.
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
  nome: string;
  nomeCientifico: string;
  emoji: string;
  doencas: Doenca[];
};
`;

export function gerarFonte(json = JSON.parse(readFileSync(CAMINHO_JSON, "utf8"))) {
  const base = paraCamel(json);
  const bloco = (nome, tipo, valor) =>
    `export const ${nome}: readonly ${tipo}[] = ${JSON.stringify(valor, null, 2)};\n`;

  return [
    CABECALHO,
    bloco("ORGAOS", "Orgao", base.orgaos),
    bloco("SINTOMAS", "Sintoma", base.sintomas),
    bloco("CULTURAS", "Cultura", base.culturas),
  ].join("\n");
}

const executadoDireto =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (executadoDireto) {
  const fonte = gerarFonte();
  writeFileSync(CAMINHO_SAIDA, fonte, "utf8");
  const base = paraCamel(JSON.parse(readFileSync(CAMINHO_JSON, "utf8")));
  const doencas = base.culturas.flatMap((c) => c.doencas);
  console.log(`Gerado ${CAMINHO_SAIDA}`);
  console.log(
    `  ${base.culturas.length} culturas, ${doencas.length} doencas, ` +
      `${base.sintomas.length} sintomas`,
  );
}
