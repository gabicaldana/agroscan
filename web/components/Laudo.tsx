"use client";

import { useSearchParams } from "next/navigation";
import { AvisoLegal } from "@/components/AvisoLegal";
import { BarraCompatibilidade } from "@/components/BarraCompatibilidade";
import { BarraGravidade } from "@/components/BarraGravidade";
import { BotaoLink } from "@/components/Botao";
import { EstadoVazio } from "@/components/EstadoVazio";
import { detalharDoenca, type Ficha } from "@/lib/diagnostico.ts";

const ROTULO_TRATAMENTO: Record<string, string> = {
  cultural: "Manejo cultural",
  biologico: "Controle biológico",
  quimico: "Controle químico",
};

/**
 * Laudo de uma doenca, montado a partir da base curada.
 *
 * A doenca vem pela query string (`?doenca=...`) e nao por rota dinamica de
 * proposito: e uma rota so no cache do service worker, entao as 29 fichas
 * abrem offline sem precisar pre-cachear 29 paginas.
 *
 * Este componente e o ponto de encontro das tres camadas de resposta. Hoje
 * so o fluxo por sintomas chega aqui; na fase 5 o modelo local passa a
 * preencher a mesma tela, e a origem muda de rotulo.
 */
export function Laudo() {
  const params = useSearchParams();
  const doencaId = params.get("doenca");
  const compatibilidade = Number(params.get("compatibilidade"));

  let ficha: Ficha;
  try {
    ficha = detalharDoenca(doencaId ?? "");
  } catch {
    return (
      <EstadoVazio
        titulo="Laudo sem doença"
        acao={
          <BotaoLink href="/sintomas" variante="secundario">
            Buscar por sintomas
          </BotaoLink>
        }
      >
        <p>
          Esta tela mostra a ficha de uma doença da base. Chegue nela pelo
          fluxo por sintomas, escolhendo uma das hipóteses.
        </p>
      </EstadoVazio>
    );
  }

  const temCompatibilidade = Number.isFinite(compatibilidade) && compatibilidade > 0;

  return (
    <>
      <div className="flex items-start gap-3">
        <span className="text-4xl" aria-hidden="true">
          {ficha.emoji}
        </span>
        <div>
          <h1 className="text-2xl leading-tight font-bold tracking-tight">
            {ficha.nome}
          </h1>
          <p className="text-texto-suave">
            <i>{ficha.agente}</i> · {ficha.tipoAgente} · {ficha.cultura}
          </p>
        </div>
      </div>

      <div className="border-borda mt-5 flex flex-col gap-4 rounded-xl border-2 p-4">
        <div>
          <h2 className="text-sm font-bold tracking-wide uppercase">Gravidade</h2>
          <div className="mt-2">
            <BarraGravidade nivel={ficha.gravidade} />
          </div>
        </div>

        {temCompatibilidade && (
          <div className="border-borda border-t-2 pt-4">
            <h2 className="text-sm font-bold tracking-wide uppercase">
              Compatibilidade com os sintomas
            </h2>
            <div className="mt-2">
              <BarraCompatibilidade pct={compatibilidade} destaque />
            </div>
          </div>
        )}

        <div className="border-borda border-t-2 pt-4">
          <h2 className="text-sm font-bold tracking-wide uppercase">Origem</h2>
          <p className="mt-1 font-semibold">
            {temCompatibilidade
              ? "Fluxo por sintomas · offline"
              : "Base de conhecimento curada"}
          </p>
          {ficha.classeModelo === null && (
            <p className="text-texto-suave mt-1 text-sm">
              O modelo de imagem não cobre esta doença - ela não tem classe no
              PlantVillage. Só o fluxo por sintomas chega até aqui.
            </p>
          )}
        </div>
      </div>

      <Secao titulo="Descrição">
        <p>{ficha.descricao}</p>
      </Secao>

      <Secao titulo="Condições favoráveis">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-semibold">Temperatura</dt>
          <dd>{ficha.condicoesFavoraveis.temperatura}</dd>
          <dt className="font-semibold">Umidade</dt>
          <dd>{ficha.condicoesFavoraveis.umidade}</dd>
        </dl>
        <p className="mt-2">{ficha.condicoesFavoraveis.observacao}</p>
      </Secao>

      <Secao titulo="Manejo">
        {agrupar(ficha.tratamentos).map(([tipo, descricoes]) => (
          <div key={tipo} className="mt-4 first:mt-0">
            <h3 className="text-texto-suave text-sm font-bold">
              {ROTULO_TRATAMENTO[tipo] ?? tipo}
            </h3>
            <ul className="mt-1 flex list-disc flex-col gap-2 pl-5">
              {descricoes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ))}
      </Secao>

      <Secao titulo="Ingredientes ativos de referência">
        {ficha.ingredientesAtivos.length === 0 ? (
          <p>
            Nenhum. Não existe defensivo que aja sobre vírus de planta - o
            manejo é todo preventivo, pelas medidas culturais acima.
          </p>
        ) : (
          <ul className="border-borda divide-borda flex flex-col divide-y-2 rounded-xl border-2">
            {ficha.ingredientesAtivos.map((i) => (
              <li key={i.nome} className="px-4 py-3">
                <p className="font-semibold">{i.nome}</p>
                <p className="text-texto-suave text-sm">
                  {i.grupo} · {i.acao}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <div className="mt-6">
        <AvisoLegal />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <BotaoLink href="/sintomas" variante="secundario">
          Voltar aos sintomas
        </BotaoLink>
      </div>
    </>
  );
}

/** Agrupa mantendo a ordem que o motor ja aplicou: cultural, biológico,
 *  químico - a ordem do manejo integrado de pragas. */
function agrupar(tratamentos: Ficha["tratamentos"]): [string, string[]][] {
  const grupos = new Map<string, string[]>();
  for (const t of tratamentos) {
    grupos.set(t.tipo, [...(grupos.get(t.tipo) ?? []), t.descricao]);
  }
  return [...grupos];
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="border-borda border-b-2 pb-1 text-sm font-bold tracking-wide uppercase">
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
