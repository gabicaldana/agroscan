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

const VERSAO = "v1";
const CACHE_APP = `agroscan-app-${VERSAO}`;
const CACHE_ESTATICO = `agroscan-estatico-${VERSAO}`;

// A raiz e a rede de seguranca para qualquer navegacao offline.
const CASCA = ["/", "/sintomas", "/caderno"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_APP)
      // addAll e tudo-ou-nada; se uma rota falhar o SW inteiro nao instala.
      // Cada uma por si mantem a instalacao resiliente.
      .then((cache) =>
        Promise.allSettled(CASCA.map((rota) => cache.add(rota))),
      )
      .then(() => self.skipWaiting()),
  );
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
  const emCache = await caches.match(request);
  if (emCache) return emCache;

  const resposta = await fetch(request);
  if (resposta.ok) {
    const cache = await caches.open(nomeCache);
    cache.put(request, resposta.clone());
  }
  return resposta;
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
