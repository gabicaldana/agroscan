/**
 * Motor de diagnostico por sintomas - porte do motor de referencia em Python
 * (app/diagnostico.py).
 *
 * Roda inteiro no navegador, sobre a base embutida no bundle: nenhuma rede,
 * nenhum servidor. E o que faz o fluxo por sintomas funcionar no meio do
 * talhao, em modo aviao.
 *
 * A pontuacao NAO e probabilidade. E um indice de compatibilidade (variante
 * ponderada do indice de Tversky) entre o quadro observado e o perfil tipico
 * da doenca. Quando o modelo de imagem entrar (fase 5), ele produzira uma
 * confianca de verdade, e os dois sinais vao conviver rotulados de forma
 * distinta.
 *
 * As duas implementacoes tem que produzir exatamente os mesmos numeros. O
 * teste em diagnostico.test.ts confere isso contra as fixtures geradas pelo
 * Python. Tres armadilhas de portabilidade estao tratadas e comentadas ao
 * longo do arquivo: ordem de soma de floats, arredondamento de .5 e ordem
 * alfabetica com acento.
 */

import {
  CULTURAS,
  ORGAOS,
  SINTOMAS,
  type Cultura,
  type Doenca,
  type Gravidade,
  type OrgaoId,
} from "./base-conhecimento.ts";

/** Quanto penalizar um sintoma marcado que a doenca nao explica.
 *  0 = ignora sintomas sobrando; 1 = pesa tanto quanto um sintoma faltando. */
export const PENALIDADE_SINTOMA_NAO_EXPLICADO = 0.5;

/** Abaixo disso a hipotese e fraca demais para ser mostrada. */
export const LIMIAR_MINIMO = 0.15;

export const ROTULOS_GRAVIDADE: Record<Gravidade, string> = {
  1: "Muito baixa",
  2: "Baixa",
  3: "Media",
  4: "Alta",
  5: "Muito alta",
};

export type SintomaPontuado = { id: string; nome: string; peso: number };
export type SintomaRef = { id: string; nome: string };

export type Hipotese = {
  doencaId: string;
  nome: string;
  agente: string;
  tipoAgente: string;
  gravidade: Gravidade;
  compatibilidade: number;
  classeModelo: string | null;
  /** Marcados que a doenca explica, do mais caracteristico ao menos. */
  sintomasCompativeis: SintomaPontuado[];
  /** Tipicos da doenca que nao foram marcados - as perguntas em aberto. */
  sintomasEsperadosAusentes: SintomaPontuado[];
  /** Marcados que esta doenca nao explica - o que enfraquece a hipotese. */
  sintomasNaoExplicados: SintomaRef[];
  compatibilidadePct: number;
  rotuloGravidade: string;
};

export type Pergunta = {
  sintomaId: string;
  nome: string;
  confirma: string;
  /** So vem preenchido quando a resposta de fato separa as duas primeiras. */
  descarta: string | null;
};

export type CulturaResumida = {
  id: string;
  nome: string;
  nomeCientifico: string;
  emoji: string;
  nDoencas: number;
};

export type SintomaDoCatalogo = {
  id: string;
  nome: string;
  orgao: OrgaoId;
  orgaoRotulo: string;
  orgaoOrdem: number;
};

export type Ficha = {
  id: string;
  nome: string;
  cultura: string;
  emoji: string;
  classeModelo: string | null;
  agente: string;
  tipoAgente: string;
  gravidade: Gravidade;
  descricao: string;
  condicoesFavoraveis: { temperatura: string; umidade: string; observacao: string };
  tratamentos: { tipo: string; descricao: string }[];
  ingredientesAtivos: { nome: string; grupo: string; acao: string }[];
};

/* ---------------------------------------------------------------- indices */

const NOME_DO_SINTOMA = new Map(SINTOMAS.map((s) => [s.id, s.nome]));
const ORGAO_POR_ID = new Map(ORGAOS.map((o) => [o.id, o]));
const CULTURA_POR_ID = new Map(CULTURAS.map((c) => [c.id, c]));

const DOENCA_POR_ID = new Map<string, { doenca: Doenca; cultura: Cultura }>(
  CULTURAS.flatMap((cultura) =>
    cultura.doencas.map((doenca) => [doenca.id, { doenca, cultura }] as const),
  ),
);

/** doencaId -> { sintomaId: peso } */
const PERFIL_POR_DOENCA = new Map<string, Map<string, number>>(
  [...DOENCA_POR_ID].map(([id, { doenca }]) => [
    id,
    new Map(doenca.sintomas.map((s) => [s.id, s.peso])),
  ]),
);

/* ----------------------------------------------------------------- ordem  */

/**
 * Chave de ordenacao alfabetica para portugues.
 *
 * Comparar strings direto joga todo acento para depois do "z": "Pessego"
 * viria depois de "Pimentao" e "Acaros" iria para o fim da lista. Tirar os
 * diacriticos antes de comparar devolve a ordem que o usuario espera.
 *
 * Nao usar localeCompare aqui: o resultado dele depende do locale do
 * aparelho, e a mesma lista sairia em ordens diferentes em celulares
 * diferentes - e nunca igual a do Python.
 */
export function chaveAlfabetica(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase();
}

/** Comparacao de strings por codigo de caractere, igual a do Python. */
function compararTexto(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Soma de floats compensada (Neumaier), que e o que o `sum()` do CPython faz.
 *
 * Somar 0.7 + 0.6 + 0.5 + 0.3 ingenuamente da 2.0999999999999996; o `sum()`
 * do Python devolve 2.1. A diferenca e de um bit e nao muda porcentagem
 * nenhuma na tela, mas quebra a igualdade exata com as fixtures - e uma
 * comparacao por tolerancia deixaria passar justamente as divergencias reais
 * que este teste existe para pegar.
 *
 * O Python e a implementacao de referencia, entao quem se ajusta e o porte.
 * A compensacao guarda o erro de arredondamento de cada soma parcial e o
 * devolve no fim.
 */
function somar(valores: number[]): number {
  let total = 0.0;
  let compensacao = 0.0;
  for (const valor of valores) {
    const parcial = total + valor;
    compensacao +=
      Math.abs(total) >= Math.abs(valor)
        ? total - parcial + valor
        : valor - parcial + total;
    total = parcial;
  }
  return total + compensacao;
}

/**
 * Arredondamento do Python: meio para o par ("banker's rounding").
 *
 * Math.round(12.5) da 13 e round(12.5) do Python da 12. Uma compatibilidade
 * que caia exatamente em .5 mostraria porcentagens diferentes nas duas
 * implementacoes - e o teste de fixtures acusaria uma divergencia real.
 */
function arredondarMeioParaPar(valor: number): number {
  const piso = Math.floor(valor);
  const resto = valor - piso;
  if (resto > 0.5) return piso + 1;
  if (resto < 0.5) return piso;
  return piso % 2 === 0 ? piso : piso + 1;
}

/* ---------------------------------------------------------------- catalogo */

/**
 * As culturas da base.
 *
 * `apenasComDoencas` filtra as que o PlantVillage so conhece como saudaveis
 * (mirtilo e framboesa): oferece-las no fluxo por sintomas seria um beco sem
 * saida.
 */
export function listarCulturas(apenasComDoencas = false): CulturaResumida[] {
  return CULTURAS.filter((c) => !apenasComDoencas || c.doencas.length > 0)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      nomeCientifico: c.nomeCientifico,
      emoji: c.emoji,
      nDoencas: c.doencas.length,
    }))
    .sort((a, b) =>
      compararTexto(chaveAlfabetica(a.nome), chaveAlfabetica(b.nome)),
    );
}

/**
 * So os sintomas que aparecem em alguma doenca daquela cultura.
 *
 * Das 58 entradas do catalogo, cada cultura usa entre 4 e 26. Mostrar as 58
 * transformaria a tela num formulario impossivel de ler sob sol.
 */
export function listarSintomasDaCultura(culturaId: string): SintomaDoCatalogo[] {
  const cultura = CULTURA_POR_ID.get(culturaId);
  if (!cultura) return [];

  const usados = new Set(
    cultura.doencas.flatMap((d) => d.sintomas.map((s) => s.id)),
  );

  return SINTOMAS.filter((s) => usados.has(s.id))
    .map((s) => {
      const orgao = ORGAO_POR_ID.get(s.orgao)!;
      return {
        id: s.id,
        nome: s.nome,
        orgao: s.orgao,
        orgaoRotulo: orgao.rotulo,
        orgaoOrdem: orgao.ordem,
      };
    })
    .sort(
      (a, b) =>
        a.orgaoOrdem - b.orgaoOrdem ||
        compararTexto(chaveAlfabetica(a.nome), chaveAlfabetica(b.nome)),
    );
}

/* -------------------------------------------------------------- pontuacao */

/**
 * Pontua todas as doencas da cultura contra os sintomas observados.
 *
 *                           acertos
 * compatibilidade = ---------------------------------
 *                   acertos + faltantes + ruido * 0.5
 *
 * O denominador penaliza os dois erros possiveis: quadro incompleto
 * (faltantes) e quadro contaminado (ruido).
 */
export function diagnosticar(
  culturaId: string,
  sintomasMarcados: Iterable<string>,
): Hipotese[] {
  const cultura = CULTURA_POR_ID.get(culturaId);
  if (!cultura) return [];

  // Um id fora do catalogo e descartado, nao contado como ruido. O caso real
  // e o service worker servindo um bundle antigo que marca um sintoma ja
  // removido da base: trata-lo como ruido penalizaria todas as hipoteses por
  // igual e estragaria o diagnostico inteiro por causa de um id obsoleto.
  const marcados = new Set(
    [...sintomasMarcados].filter((s) => NOME_DO_SINTOMA.has(s)),
  );
  if (marcados.size === 0) return [];

  const hipoteses: Hipotese[] = [];

  for (const doenca of cultura.doencas) {
    const perfil = PERFIL_POR_DOENCA.get(doenca.id)!;

    const compativeis = ordenarPorPeso(
      [...perfil.keys()].filter((s) => marcados.has(s)),
      perfil,
    );
    const ausentes = ordenarPorPeso(
      [...perfil.keys()].filter((s) => !marcados.has(s)),
      perfil,
    );
    const naoExplicados = [...marcados]
      .filter((s) => !perfil.has(s))
      .sort(compararTexto)
      .map((s) => ({ id: s, nome: NOME_DO_SINTOMA.get(s)! }));

    // Somar na MESMA ordem e pelo MESMO algoritmo do Python. Soma de ponto
    // flutuante nao e associativa: 0.4+0.3+0.9 e 0.9+0.4+0.3 diferem no
    // ultimo bit. As duas listas ja vieram ordenadas por (-peso, id), que e
    // a ordem usada la, e `somar` replica a compensacao do `sum()` do Python.
    const acertos = somar(compativeis.map((s) => s.peso));
    const faltantes = somar(ausentes.map((s) => s.peso));
    const ruido = naoExplicados.length * PENALIDADE_SINTOMA_NAO_EXPLICADO;

    const denominador = acertos + faltantes + ruido;
    const compatibilidade = denominador ? acertos / denominador : 0;

    if (compatibilidade < LIMIAR_MINIMO) continue;

    hipoteses.push({
      doencaId: doenca.id,
      nome: doenca.nome,
      agente: doenca.agente,
      tipoAgente: doenca.tipoAgente,
      gravidade: doenca.gravidade,
      compatibilidade,
      classeModelo: doenca.classeModelo,
      sintomasCompativeis: compativeis,
      sintomasEsperadosAusentes: ausentes,
      sintomasNaoExplicados: naoExplicados,
      compatibilidadePct: arredondarMeioParaPar(compatibilidade * 100),
      rotuloGravidade: ROTULOS_GRAVIDADE[doenca.gravidade],
    });
  }

  // Empate em compatibilidade: sobe a mais grave, porque o custo de ignorar
  // a doenca mais destrutiva e maior. Empate tambem na gravidade: o id, que
  // nao significa nada mas garante ordem identica nas duas implementacoes.
  return hipoteses.sort(
    (a, b) =>
      b.compatibilidade - a.compatibilidade ||
      b.gravidade - a.gravidade ||
      compararTexto(a.doencaId, b.doencaId),
  );
}

/** Maior peso primeiro; o id desempata para a ordem ser reproduzivel. */
function ordenarPorPeso(
  ids: string[],
  perfil: Map<string, number>,
): SintomaPontuado[] {
  return ids
    .map((id) => ({ id, nome: NOME_DO_SINTOMA.get(id)!, peso: perfil.get(id)! }))
    .sort((a, b) => b.peso - a.peso || compararTexto(a.id, b.id));
}

/**
 * O sintoma que o agronomo deve ir verificar na planta agora.
 *
 * Entre os sintomas que a hipotese lider espera e que ainda nao foram
 * marcados, escolhe o de maior `peso na lider - peso na segunda`.
 *
 * Essa diferenca e exatamente o quanto a resposta afasta as duas hipoteses:
 * se o sintoma estiver presente, ambas ganham, mas a lider ganha a mais
 * justamente essa diferenca. Um sintoma que as duas esperam com o mesmo peso
 * tem diferenca zero - confirma o quadro e nao decide nada.
 *
 * Nao basta pegar o de maior peso: o sintoma mais caracteristico da lider
 * costuma ser tambem caracteristico da concorrente, que e por que as duas
 * estao empatadas.
 */
export function melhorPergunta(hipoteses: Hipotese[]): Pergunta | null {
  if (hipoteses.length === 0) return null;

  const lider = hipoteses[0];
  if (lider.sintomasEsperadosAusentes.length === 0) return null;

  const segunda = hipoteses.length > 1 ? hipoteses[1] : null;
  const perfilSegunda = new Map<string, number>(
    segunda
      ? [...segunda.sintomasCompativeis, ...segunda.sintomasEsperadosAusentes].map(
          (s) => [s.id, s.peso],
        )
      : [],
  );

  const ganho = (s: SintomaPontuado) => s.peso - (perfilSegunda.get(s.id) ?? 0);

  const escolhido = [...lider.sintomasEsperadosAusentes].sort(
    (a, b) => ganho(b) - ganho(a) || b.peso - a.peso || compararTexto(a.id, b.id),
  )[0];

  // So promete descartar a segunda quando ela nao espera esse sintoma de
  // forma alguma. Se ela tambem o espera, ainda que mais fraco, dizer que a
  // resposta a descarta seria exagero - e a interface repete o que o motor
  // afirma aqui.
  const descarta =
    segunda && !perfilSegunda.has(escolhido.id) ? segunda.nome : null;

  return {
    sintomaId: escolhido.id,
    nome: escolhido.nome,
    confirma: lider.nome,
    descarta,
  };
}

/** Ficha completa: descricao, condicoes, manejo e ingredientes ativos. */
export function detalharDoenca(doencaId: string): Ficha {
  const encontrado = DOENCA_POR_ID.get(doencaId);
  if (!encontrado) throw new Error(`doenca desconhecida: ${doencaId}`);

  const { doenca, cultura } = encontrado;

  // Cultural antes de biologico antes de quimico. Nao e cosmetico: e a ordem
  // que o manejo integrado recomenda, e inverte-la sugeriria que a primeira
  // resposta a uma doenca e pulverizar.
  const ordemMip: Record<string, number> = { cultural: 1, biologico: 2, quimico: 3 };
  const tratamentos = [...doenca.tratamentos].sort(
    (a, b) => (ordemMip[a.tipo] ?? 4) - (ordemMip[b.tipo] ?? 4),
  );

  return {
    id: doenca.id,
    nome: doenca.nome,
    cultura: cultura.nome,
    emoji: cultura.emoji,
    classeModelo: doenca.classeModelo,
    agente: doenca.agente,
    tipoAgente: doenca.tipoAgente,
    gravidade: doenca.gravidade,
    descricao: doenca.descricao,
    condicoesFavoraveis: doenca.condicoesFavoraveis,
    tratamentos: tratamentos.map((t) => ({ tipo: t.tipo, descricao: t.descricao })),
    ingredientesAtivos: doenca.ingredientesAtivos.map((i) => ({
      nome: i.nome,
      grupo: i.grupo,
      acao: i.acao,
    })),
  };
}
