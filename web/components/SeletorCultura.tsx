"use client";

import { listarCulturas } from "@/lib/diagnostico.ts";
import { foraDoModelo } from "@/lib/modelo.ts";

/**
 * As culturas vem da base de conhecimento, nao de uma lista escrita aqui.
 *
 * Informar a cultura restringe o modelo (fase 5) as doencas que realmente
 * ocorrem nela: o PlantVillage empacota cultura e doenca na mesma classe
 * (`Tomato___Early_blight`), e o agronomo *sabe* o que plantou.
 */
const TODAS = listarCulturas();
const COM_DOENCA = listarCulturas(true);

/** Cana, cafe e algodao estao na base mas nao no dataset - ver modelo.ts. */
const cobertas = (cs: typeof TODAS) => cs.filter((c) => !foraDoModelo(c.id));
const naoCobertas = (cs: typeof TODAS) => cs.filter((c) => foraDoModelo(c.id));

export function SeletorCultura({
  valor,
  aoTrocar,
  apenasComDoencas = false,
  separarPorCoberturaDoModelo = false,
  ajuda,
}: {
  valor: string;
  aoTrocar: (culturaId: string) => void;
  /** No fluxo por sintomas, cultura sem doenca cadastrada e beco sem saida. */
  apenasComDoencas?: boolean;
  /**
   * Agrupa a lista pelo que o modelo de imagem cobre.
   *
   * So faz sentido na tela da camera. No fluxo por sintomas a distincao e
   * irrelevante - o motor pontua as 44 doencas da base igualmente, e agrupar
   * ali sugeriria que cana e cafe sao opcoes de segunda classe, o que nao e
   * verdade naquele fluxo.
   */
  separarPorCoberturaDoModelo?: boolean;
  ajuda?: string;
}) {
  const culturas = apenasComDoencas ? COM_DOENCA : TODAS;
  const fora = separarPorCoberturaDoModelo ? naoCobertas(culturas) : [];

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
        {fora.length === 0 ? (
          culturas.map((c) => <Opcao key={c.id} cultura={c} />)
        ) : (
          <>
            <optgroup label="O modelo de imagem reconhece">
              {cobertas(culturas).map((c) => (
                <Opcao key={c.id} cultura={c} />
              ))}
            </optgroup>
            <optgroup label="Só pelo fluxo por sintomas">
              {fora.map((c) => (
                <Opcao key={c.id} cultura={c} />
              ))}
            </optgroup>
          </>
        )}
      </select>
      {ajuda && <p className="text-texto-suave mt-2 text-sm">{ajuda}</p>}
    </div>
  );
}

function Opcao({ cultura }: { cultura: (typeof TODAS)[number] }) {
  return (
    <option value={cultura.id}>
      {cultura.emoji}  {cultura.nome}
    </option>
  );
}
