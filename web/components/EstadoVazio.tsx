import type { ReactNode } from "react";

/**
 * Estado vazio honesto: diz o que ainda nao existe e em que fase chega,
 * em vez de fingir uma tela pronta.
 */
export function EstadoVazio({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="border-borda bg-superficie rounded-xl border-2 border-dashed p-8 text-center">
      <h2 className="text-lg font-bold">{titulo}</h2>
      <div className="text-texto-suave mx-auto mt-2 max-w-md text-sm">
        {children}
      </div>
      {acao && <div className="mt-6 flex justify-center">{acao}</div>}
    </div>
  );
}
