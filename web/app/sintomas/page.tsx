import type { Metadata } from "next";
import { BotaoLink } from "@/components/Botao";
import { EstadoVazio } from "@/components/EstadoVazio";

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

      <div className="mt-6">
        <EstadoVazio
          titulo="Chega na fase 3"
          acao={
            <BotaoLink href="/" variante="secundario">
              Voltar ao scanner
            </BotaoLink>
          }
        >
          <p>
            O motor de pontuação já existe e está testado em Python. A fase 3
            porta essa lógica para o app e expande a base de conhecimento para
            as 26 doenças cobertas pelo modelo.
          </p>
        </EstadoVazio>
      </div>
    </div>
  );
}
