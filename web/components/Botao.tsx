import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario";

const BASE =
  "inline-flex min-h-toque items-center justify-center gap-3 rounded-lg border-2 px-6 text-center text-base font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none";

const VARIANTES: Record<Variante, string> = {
  // Preenchido: a acao principal da tela. Um por tela, no maximo.
  primario:
    "bg-primaria border-primaria text-white active:bg-primaria-escura active:border-primaria-escura",
  // Contornado: bordas solidas em vez de sombra, que some sob sol forte.
  secundario:
    "bg-fundo border-borda-forte text-texto active:bg-superficie",
};

type PropsBotao = {
  variante?: Variante;
  children: ReactNode;
} & ComponentProps<"button">;

export function Botao({
  variante = "primario",
  className = "",
  children,
  ...resto
}: PropsBotao) {
  return (
    <button className={`${BASE} ${VARIANTES[variante]} ${className}`} {...resto}>
      {children}
    </button>
  );
}

type PropsBotaoLink = {
  variante?: Variante;
  children: ReactNode;
} & ComponentProps<typeof Link>;

export function BotaoLink({
  variante = "primario",
  className = "",
  children,
  ...resto
}: PropsBotaoLink) {
  return (
    <Link className={`${BASE} ${VARIANTES[variante]} ${className}`} {...resto}>
      {children}
    </Link>
  );
}
