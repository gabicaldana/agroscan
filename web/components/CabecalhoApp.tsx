import { IndicadorRede } from "./IndicadorRede";

export function CabecalhoApp() {
  return (
    <header className="border-borda bg-fundo sticky top-0 z-10 border-b-2">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <span className="text-lg font-bold tracking-tight">
          Agro<span className="text-primaria">Scan</span>
        </span>
        <IndicadorRede />
      </div>
    </header>
  );
}
