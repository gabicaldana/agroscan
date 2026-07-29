import type { Metadata } from "next";
import { PainelSintomas } from "@/components/PainelSintomas";

export const metadata: Metadata = {
  title: "Buscar por sintomas - AgroScan",
};

export default function PaginaSintomas() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Buscar por sintomas</h1>
      <p className="text-texto-suave mt-1">
        Marque o que você observa na planta. O sistema ordena as doenças
        compatíveis e indica qual sintoma verificar para desempatar.
      </p>

      <PainelSintomas />
    </div>
  );
}
