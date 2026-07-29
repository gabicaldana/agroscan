import { PainelScanner } from "@/components/PainelScanner";

export default function PaginaScanner() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Escanear planta</h1>
      <p className="text-texto-suave mt-1">
        Escolha a cultura e aponte a câmera para a folha afetada.
      </p>

      <PainelScanner />
    </div>
  );
}
