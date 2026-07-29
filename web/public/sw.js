/**
 * Service worker do AgroScan.
 *
 * Escrito a mao, sem Serwist/Workbox: as duas exigem configuracao de webpack,
 * e o Next 16 usa Turbopack por padrao. O escopo aqui e pequeno o bastante
 * para nao justificar sair do padrao.
 *
 * Tres estrategias, por tipo de recurso:
 *   - navegacao (HTML): rede primeiro, cache como rede de seguranca. Garante
 *     que o agronomo pegue a versao nova quando tem sinal, e ainda assim abra
 *     o app no meio do talhao sem sinal nenhum.
 *   - /_next/static: cache primeiro. O nome do arquivo carrega um hash do
 *     conteudo, entao nunca fica obsoleto.
 *   - demais GET da mesma origem: entrega do cache e revalida em segundo
 *     plano.
 *
 * /api/ nunca e cacheado: a analise avancada precisa de uma resposta fresca,
 * e uma resposta velha ali seria um diagnostico errado.
 */

const VERSAO = "v2";
const CACHE_APP = `agroscan-app-${VERSAO}`;
const CACHE_ESTATICO = `agroscan-estatico-${VERSAO}`;

// Rotas que precisam abrir sem rede. A raiz e tambem a rede de seguranca
// para qualquer navegacao offline que nao esteja nesta lista.
const CASCA = ["/", "/sintomas", "/resultado", "/caderno"];

/**
 * Extrai do HTML os arquivos que a pagina precisa para renderizar.
 *
 * Isto existe por causa de uma armadilha real: na PRIMEIRA visita o service
 * worker ainda nao controla a pagina. O navegador ja baixou CSS, JS e fontes
 * antes de o `fetch` daqui existir, entao esses arquivos passam sem ser
 * interceptados e nunca entram no cache. No modo aviao o HTML abria e o CSS
 * nao - app sem estilo nenhum.
 *
 * Cachear so o HTML nao basta: HTML nao carrega junto o que ele referencia.
 * Entao lemos o proprio HTML e buscamos os arquivos citados, de forma
 * independente do que o navegador fez ou deixou de fazer.
 *
 * Os nomes carregam hash de conteudo e mudam a cada build, entao precisam ser
 * descobertos em tempo de execucao - nao da para escrever uma lista fixa aqui.
 */
function extrairRecursos(html) {
  const urls = new Set();
  // Pega href="..." e src="..." que apontem para os assets do build.
  const padrao = /(?:href|src)="(\/_next\/static\/[^"]+)"/g;
  let achado;
  while ((achado = padrao.exec(html)) !== null) {
    urls.add(achado[1]);
  }
  return [...urls];
}

async function preencherCasca() {
  const cacheApp = await caches.open(CACHE_APP);
  const cacheEstatico = await caches.open(CACHE_ESTATICO);
  const recursos = new Set();

  for (const rota of CASCA) {
    try {
      // `cache: "reload"` ignora o cache HTTP do navegador e garante que
      // estamos guardando a versao recem-publicada, nao uma anterior.
      const resposta = await fetch(rota, { cache: "reload" });
      if (!resposta.ok) continue;

      // clone() antes de ler: o corpo de uma Response so pode ser consumido
      // uma vez, e precisamos dele duas (guardar e analisar).
      await cacheApp.put(rota, resposta.clone());
      for (const url of extrairRecursos(await resposta.text())) {
        recursos.add(url);
      }
    } catch {
      // Uma rota indisponivel nao pode impedir a instalacao das outras.
    }
  }

  // allSettled em vez de addAll: addAll e tudo-ou-nada, e um unico arquivo
  // que falhe derrubaria o cache inteiro.
  await Promise.allSettled(
    [...recursos].map((url) => cacheEstatico.add(url)),
  );
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(preencherCasca().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => !nome.endsWith(VERSAO))
            .map((nome) => caches.delete(nome)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    evento.respondWith(redePrimeiro(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(cachePrimeiro(request, CACHE_ESTATICO));
    return;
  }

  evento.respondWith(revalidaEmSegundoPlano(request, CACHE_ESTATICO));
});

async function redePrimeiro(request) {
  const cache = await caches.open(CACHE_APP);
  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  } catch {
    // Offline: a propria rota, ou a raiz como ultimo recurso.
    return (
      (await cache.match(request)) ??
      (await cache.match("/")) ??
      Response.error()
    );
  }
}

async function cachePrimeiro(request, nomeCache) {
  const cache = await caches.open(nomeCache);
  const emCache = await cache.match(request);
  if (emCache) return emCache;

  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  } catch {
    // Sem rede e sem copia local. Devolver um erro tratado em vez de deixar
    // a promise rejeitar mantem o log do navegador legivel.
    return Response.error();
  }
}

async function revalidaEmSegundoPlano(request, nomeCache) {
  const cache = await caches.open(nomeCache);
  const emCache = await cache.match(request);

  const daRede = fetch(request)
    .then((resposta) => {
      if (resposta.ok) cache.put(request, resposta.clone());
      return resposta;
    })
    .catch(() => undefined);

  // Se ja temos versao local, responde na hora e atualiza por tras.
  const resposta = emCache ?? (await daRede);
  return resposta ?? Response.error();
}
