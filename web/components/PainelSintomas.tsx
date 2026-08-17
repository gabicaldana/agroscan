"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarraCompatibilidade } from "@/components/BarraCompatibilidade";
import { BarraGravidade } from "@/components/BarraGravidade";
import { SeletorCultura } from "@/components/SeletorCultura";
import {
  diagnosticar,
  listarSintomasDaCultura,
  melhorPergunta,
  type Hipotese,
  type SintomaDoCatalogo,
} from "@/lib/diagnostico.ts";

/**
 * Fluxo por sintomas: o agronomo marca o que ve e o ranking se atualiza a
 * cada toque.
 *
 * Tudo roda no navegador, sobre a base embutida no bundle - sem rede, sem
 * servidor, sem estado remoto. E o unico modo de o app funcionar no meio do
 * talhao, que e onde ele precisa funcionar.
 *
 * O recalculo e sincrono de proposito: sao 44 doencas e 58 sintomas, e o
 * resultado sai em menos de um milissegundo. Estado de carregamento aqui
 * seria teatro.
 */
export function PainelSintomas() {
  const [culturaId, setCulturaId] = useState("Tomato");
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(new Set());

  const sintomas = useMemo(() => listarSintomasDaCultura(culturaId), [culturaId]);
  const hipoteses = useMemo(
    () => diagnosticar(culturaId, marcados),
    [culturaId, marcados],
  );
  const pergunta = useMemo(() => melhorPergunta(hipoteses), [hipoteses]);

  function alternar(sintomaId: string) {
    setMarcados((atual) => {
      const proximo = new Set(atual);
      if (!proximo.delete(sintomaId)) proximo.add(sintomaId);
      return proximo;
    });
  }

  function trocarCultura(novaCultura: string) {
    setCulturaId(novaCultura);
    // Os sintomas sao especificos da cultura: manter as marcacoes ao trocar
    // levaria marcas invisiveis (que nem aparecem na nova lista) para dentro
    // do calculo, e o usuario veria um ranking que nao explica.
    setMarcados(new Set());
  }

  // Agrupa preservando a ordem do motor: folha, caule, fruto, planta - a
  // ordem em que se olha a planta, nao a alfabetica.
  const grupos = useMemo(() => {
    const porOrgao = new Map<string, { rotulo: string; itens: SintomaDoCatalogo[] }>();
    for (const s of sintomas) {
      const grupo = porOrgao.get(s.orgao) ?? { rotulo: s.orgaoRotulo, itens: [] };
      grupo.itens.push(s);
      porOrgao.set(s.orgao, grupo);
    }
    return [...porOrgao.values()];
  }, [sintomas]);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <SeletorCultura
        valor={culturaId}
        aoTrocar={trocarCultura}
        apenasComDoencas
        ajuda="Só as culturas com doenças na base aparecem aqui."
      />

      <section aria-labelledby="titulo-sintomas">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="titulo-sintomas" className="text-lg font-bold">
            Sintomas observados
          </h2>
          {marcados.size > 0 && (
            <button
              type="button"
              onClick={() => setMarcados(new Set())}
              className="text-texto-suave shrink-0 py-2 text-sm font-semibold underline"
            >
              Limpar {marcados.size}
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-5">
          {grupos.map((grupo) => (
            <fieldset key={grupo.rotulo}>
              <legend className="text-texto-suave mb-1 text-sm font-bold tracking-wide uppercase">
                {grupo.rotulo}
              </legend>
              <ul className="border-borda divide-borda divide-y-2 rounded-xl border-2">
                {grupo.itens.map((s) => (
                  <li key={s.id}>
                    <ItemSintoma
                      sintoma={s}
                      marcado={marcados.has(s.id)}
                      destacado={pergunta?.sintomaId === s.id}
                      aoAlternar={() => alternar(s.id)}
                    />
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-hipoteses" aria-live="polite">
        <h2 id="titulo-hipoteses" className="text-lg font-bold">
          Hipóteses
        </h2>

        {marcados.size === 0 ? (
          <p className="text-texto-suave border-borda bg-superficie mt-3 rounded-xl border-2 border-dashed p-6 text-center text-sm">
            Marque ao menos um sintoma acima. O ranking se atualiza a cada
            marcação.
          </p>
        ) : hipoteses.length === 0 ? (
          <SemHipotese />
        ) : (
          <>
            {pergunta && (
              <PainelPergunta
                nome={pergunta.nome}
                confirma={pergunta.confirma}
                descarta={pergunta.descarta}
              />
            )}
            <ul className="mt-4 flex flex-col gap-4">
              {hipoteses.map((h, i) => (
                <li key={h.doencaId}>
                  <CartaoHipotese hipotese={h} lider={i === 0} />
                </li>
              ))}
            </ul>
            <p className="text-texto-suave mt-4 text-sm">
              Compatibilidade não é probabilidade: é o quanto o quadro marcado
              bate com o perfil típico de cada doença. Quando o modelo de
              imagem entrar, a confiança dele aparecerá como um número
              separado deste.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function ItemSintoma({
  sintoma,
  marcado,
  destacado,
  aoAlternar,
}: {
  sintoma: SintomaDoCatalogo;
  marcado: boolean;
  /** O sintoma que o motor sugeriu verificar: fica marcado na propria lista,
   *  para o agronomo achar de imediato o que foi pedido logo acima. */
  destacado: boolean;
  aoAlternar: () => void;
}) {
  return (
    <label
      className={`min-h-toque flex cursor-pointer items-center gap-4 px-4 py-3 ${
        marcado ? "bg-primaria-clara" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={marcado}
        onChange={aoAlternar}
        className="accent-primaria size-7 shrink-0"
      />
      <span className="text-base leading-snug font-medium">
        {sintoma.nome}
        {destacado && !marcado && (
          <span className="border-primaria text-primaria ml-2 rounded-full border-2 px-2 py-0.5 align-middle text-xs font-bold whitespace-nowrap">
            verifique
          </span>
        )}
      </span>
    </label>
  );
}

function PainelPergunta({
  nome,
  confirma,
  descarta,
}: {
  nome: string;
  confirma: string;
  descarta: string | null;
}) {
  return (
    <div className="border-primaria bg-primaria-clara mt-3 rounded-xl border-2 p-4">
      <h3 className="text-sm font-bold tracking-wide uppercase">
        Próxima observação na planta
      </h3>
      <p className="mt-1 text-base font-bold">{nome}</p>
      <p className="mt-1 text-sm">
        {descarta ? (
          <>
            Se estiver presente, reforça <strong>{confirma}</strong> e afasta{" "}
            <strong>{descarta}</strong>.
          </>
        ) : (
          <>
            Ajuda a confirmar <strong>{confirma}</strong>. As demais hipóteses
            também esperam esse sintoma, então ele não desempata sozinho.
          </>
        )}
      </p>
    </div>
  );
}

function SemHipotese() {
  return (
    <div className="border-alerta bg-alerta-fundo mt-3 rounded-xl border-2 p-5">
      <h3 className="font-bold">Nenhuma hipótese compatível</h3>
      <p className="mt-1 text-sm">
        Os sintomas marcados não formam um quadro compatível com as doenças
        cadastradas para esta cultura. Pode ser combinação de sintomas de
        origens diferentes, deficiência nutricional, dano por defensivo, ou
        uma doença que a base ainda não cobre. Revise as marcações ou leve uma
        amostra a um laboratório de fitopatologia.
      </p>
    </div>
  );
}

function CartaoHipotese({
  hipotese,
  lider,
}: {
  hipotese: Hipotese;
  lider: boolean;
}) {
  return (
    <Link
      href={`/resultado?doenca=${hipotese.doencaId}&compatibilidade=${hipotese.compatibilidadePct}`}
      className={`block rounded-xl border-2 p-4 ${
        lider ? "border-primaria" : "border-borda"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg leading-tight font-bold">{hipotese.nome}</h3>
          <p className="text-texto-suave text-sm">
            <i>{hipotese.agente}</i> · {hipotese.tipoAgente}
          </p>
        </div>
        <span className="text-texto-suave shrink-0 text-sm font-bold">Ver ›</span>
      </div>

      <div className="mt-3">
        <BarraCompatibilidade
          pct={hipotese.compatibilidadePct}
          destaque={lider}
        />
      </div>

      <div className="mt-3">
        <BarraGravidade nivel={hipotese.gravidade} />
      </div>

      {hipotese.sintomasNaoExplicados.length > 0 && (
        <p className="text-texto-suave mt-3 text-sm">
          Não explica:{" "}
          {hipotese.sintomasNaoExplicados.map((s) => s.nome.toLowerCase()).join("; ")}.
        </p>
      )}
    </Link>
  );
}
