export type NivelGravidade = 1 | 2 | 3 | 4 | 5;

const ROTULOS: Record<NivelGravidade, string> = {
  1: "Muito baixa",
  2: "Baixa",
  3: "Média",
  4: "Alta",
  5: "Muito alta",
};

// Classes escritas por extenso porque o Tailwind varre o codigo-fonte em
// busca de nomes de classe literais — `bg-grav-${nivel}` nunca seria gerado.
const CORES: Record<NivelGravidade, string> = {
  1: "bg-grav-1",
  2: "bg-grav-2",
  3: "bg-grav-3",
  4: "bg-grav-4",
  5: "bg-grav-5",
};

/**
 * Gravidade em tres canais redundantes: quantidade de blocos preenchidos,
 * cor e rotulo textual. Quem nao distingue as cores continua lendo o nivel
 * pelo preenchimento e pelo texto.
 */
export function BarraGravidade({ nivel }: { nivel: NivelGravidade }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex gap-1"
        role="img"
        aria-label={`Gravidade ${nivel} de 5: ${ROTULOS[nivel]}`}
      >
        {([1, 2, 3, 4, 5] as const).map((posicao) => (
          <span
            key={posicao}
            className={`h-4 w-6 rounded-sm ${
              posicao <= nivel ? CORES[nivel] : "bg-superficie border-borda border"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold">{ROTULOS[nivel]}</span>
    </div>
  );
}
