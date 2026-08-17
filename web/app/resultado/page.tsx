import type { Metadata } from "next";
import { Suspense } from "react";
import { Laudo } from "@/components/Laudo";

export const metadata: Metadata = {
  title: "Laudo - AgroScan",
};

/**
 * Laudo de uma doenca da base curada.
 *
 * A rota e uma so, parametrizada pela query string, e o conteudo e montado no
 * cliente a partir da base embutida no bundle. Isso e o que permite ao
 * service worker cachear "/resultado" uma vez e abrir as 44 fichas offline.
 *
 * `useSearchParams` obriga o Suspense: o Next prerenderiza a casca da pagina
 * e o cliente preenche o resto. Sem o boundary, o build falha.
 */
export default function PaginaResultado() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Suspense fallback={<p className="text-texto-suave">Abrindo laudo…</p>}>
        <Laudo />
      </Suspense>
    </div>
  );
}
