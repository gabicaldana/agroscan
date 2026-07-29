import type { Metadata } from "next";
import { BotaoLink } from "@/components/Botao";
import { EstadoVazio } from "@/components/EstadoVazio";

export const metadata: Metadata = {
  title: "Caderno de campo — AgroScan",
};

export default function PaginaCaderno() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Caderno de campo</h1>
      <p className="text-texto-suave mt-1">
        Cada diagnóstico fica salvo no próprio aparelho, com foto, data e
        localização. Sem conta e sem servidor.
      </p>

      <div className="mt-6">
        <EstadoVazio
          titulo="Chega na fase 7"
          acao={
            <BotaoLink href="/" variante="secundario">
              Voltar ao scanner
            </BotaoLink>
          }
        >
          <p>
            O histórico será gravado em IndexedDB, o que mantém tudo funcionando
            offline e sem enviar suas fotos para lugar nenhum.
          </p>
        </EstadoVazio>
      </div>
    </div>
  );
}
