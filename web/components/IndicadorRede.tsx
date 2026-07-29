"use client";

import { useEffect, useState } from "react";

/**
 * Estado da rede, sempre visivel.
 *
 * Nao e enfeite: a camada de analise avancada (que envia a foto para uma
 * API) so existe com rede. O agronomo precisa saber, antes de tentar, se
 * aquela opcao esta disponivel - e o app precisa dizer isso sem que ele
 * tenha que descobrir por tentativa e erro no meio da lavoura.
 */
export function useEstaOnline(): boolean | null {
  // `null` ate montar: no servidor nao existe `navigator`, e chutar um
  // valor causaria divergencia de hidratacao.
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  return online;
}

export function IndicadorRede() {
  const online = useEstaOnline();

  if (online === null) return null;

  return (
    <span
      className={`flex items-center gap-2 text-sm font-semibold ${
        online ? "text-texto-suave" : "text-offline"
      }`}
      // Muda pouco e nao deve interromper o que o leitor de tela esta lendo.
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={`size-3 rounded-full ${
          online ? "bg-primaria" : "border-offline border-2 bg-transparent"
        }`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
