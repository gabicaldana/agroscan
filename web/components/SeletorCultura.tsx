"use client";

import { listarCulturas } from "@/lib/diagnostico.ts";

/**
 * As culturas vem da base de conhecimento, nao de uma lista escrita aqui.
 *
 * Informar a cultura restringe o modelo (fase 5) as doencas que realmente
 * ocorrem nela: o PlantVillage empacota cultura e doenca na mesma classe
 * (`Tomato___Early_blight`), e o agronomo *sabe* o que plantou.
 */
const TODAS = listarCulturas();
const COM_DOENCA = listarCulturas(true);

export function SeletorCultura({
  valor,
  aoTrocar,
  apenasComDoencas = false,
  ajuda,
}: {
  valor: string;
  aoTrocar: (culturaId: string) => void;
  /** No fluxo por sintomas, cultura sem doenca cadastrada e beco sem saida. */
  apenasComDoencas?: boolean;
  ajuda?: string;
}) {
  const culturas = apenasComDoencas ? COM_DOENCA : TODAS;

  return (
    <div>
      <label htmlFor="cultura" className="mb-2 block text-base font-bold">
        Cultura
      </label>
      <select
        id="cultura"
        value={valor}
        onChange={(e) => aoTrocar(e.target.value)}
        className="border-borda-forte bg-fundo h-toque w-full rounded-lg border-2 px-4 text-base font-semibold"
      >
        {culturas.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji}  {c.nome}
          </option>
        ))}
      </select>
      {ajuda && <p className="text-texto-suave mt-2 text-sm">{ajuda}</p>}
    </div>
  );
}
