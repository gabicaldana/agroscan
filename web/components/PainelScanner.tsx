"use client";

import { useState } from "react";
import { BotaoLink, Botao } from "@/components/Botao";
import { SeletorCultura } from "@/components/SeletorCultura";
import { listarCulturas } from "@/lib/diagnostico.ts";

const CULTURAS = listarCulturas();

export function PainelScanner() {
  const [culturaId, setCulturaId] = useState("Tomato");
  const cultura = CULTURAS.find((c) => c.id === culturaId);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <SeletorCultura
        valor={culturaId}
        aoTrocar={setCulturaId}
        ajuda="Informar a cultura restringe o modelo às doenças que realmente ocorrem nela - reduz bastante o erro."
      />

      <Visor legenda={cultura ? `Centralize a folha de ${cultura.nome.toLowerCase()}` : "Centralize a folha"} />

      <Botao disabled aria-describedby="aviso-fase">
        <IconeCamera />
        Escanear
      </Botao>
      <p id="aviso-fase" className="text-texto-suave -mt-3 text-center text-sm">
        A câmera e o modelo entram na fase 5. Por enquanto, use o fluxo por
        sintomas.
      </p>

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="bg-borda h-0.5 flex-1" />
        <span className="text-texto-suave text-sm font-semibold">ou</span>
        <span className="bg-borda h-0.5 flex-1" />
      </div>

      <BotaoLink href="/sintomas" variante="secundario">
        Buscar por sintomas
      </BotaoLink>
    </div>
  );
}

/**
 * Moldura-guia do visor. Os cantos marcam onde a folha deve ficar - o
 * enquadramento consistente e o que faz o pre-processamento da imagem bater
 * com o do treino.
 */
function Visor({ legenda }: { legenda: string }) {
  return (
    <div className="border-borda-forte bg-superficie relative aspect-square w-full overflow-hidden rounded-xl border-2">
      <div className="absolute inset-6">
        {(
          [
            "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
            "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
            "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-lg",
            "right-0 bottom-0 border-r-4 border-b-4 rounded-br-lg",
          ] as const
        ).map((posicao) => (
          <span
            key={posicao}
            aria-hidden="true"
            className={`border-primaria absolute size-10 ${posicao}`}
          />
        ))}
      </div>
      <p className="text-texto-suave absolute inset-x-6 bottom-6 text-center text-sm font-semibold">
        {legenda}
      </p>
    </div>
  );
}

function IconeCamera() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
