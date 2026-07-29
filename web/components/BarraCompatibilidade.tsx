/**
 * Compatibilidade entre o quadro observado e o perfil tipico da doenca.
 *
 * O rotulo diz "compatibilidade", nunca "confianca" nem "probabilidade": nao
 * ha modelo probabilistico por tras disso, e vender um indice de similaridade
 * como probabilidade seria mentir para quem vai decidir uma pulverizacao.
 * Quando a CNN entrar (fase 5) ela produzira uma confianca de verdade, e os
 * dois numeros vao aparecer rotulados de forma distinta.
 */
export function BarraCompatibilidade({
  pct,
  destaque = false,
}: {
  pct: number;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="border-borda-forte bg-superficie h-4 flex-1 overflow-hidden rounded-full border-2"
        role="img"
        aria-label={`Compatibilidade de ${pct}%`}
      >
        <div
          className={`h-full ${destaque ? "bg-primaria" : "bg-borda-forte"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 text-right text-base font-bold tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
