"use client";

import { useEffect } from "react";

/**
 * Registra o service worker que torna o app utilizavel offline.
 *
 * Nao renderiza nada - existe so pelo efeito. Falha silenciosa e
 * proposital: sem service worker o app continua funcionando com rede,
 * so perde o offline.
 */
export function RegistroServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((erro) => {
        console.warn("Service worker não registrado:", erro);
      });
  }, []);

  return null;
}
