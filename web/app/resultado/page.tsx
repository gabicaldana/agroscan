import type { Metadata } from "next";
import { AvisoLegal } from "@/components/AvisoLegal";
import { BarraGravidade } from "@/components/BarraGravidade";
import { BotaoLink } from "@/components/Botao";

export const metadata: Metadata = {
  title: "Laudo - AgroScan",
};

/**
 * Prévia do laudo com dados fixos.
 *
 * Serve para fechar o desenho do layout antes de existir modelo: é este o
 * contrato de saída que as três camadas (modelo local, fluxo por sintomas e
 * análise avançada) vão preencher. Os dados reais vêm de
 * `data/base_conhecimento.json` a partir da fase 3.
 */
export default function PaginaResultado() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="border-borda-forte text-texto-suave mb-4 inline-block rounded-full border-2 px-3 py-1 text-xs font-bold tracking-wide uppercase">
        Prévia do layout - dados de exemplo
      </p>

      <div className="flex items-start gap-3">
        <span className="text-4xl" aria-hidden="true">
          🍅
        </span>
        <div>
          <h1 className="text-2xl leading-tight font-bold tracking-tight">
            Pinta-preta
          </h1>
          <p className="text-texto-suave">
            <i>Alternaria solani</i> · fungo · Tomate
          </p>
        </div>
      </div>

      <div className="border-borda mt-5 flex flex-col gap-4 rounded-xl border-2 p-4">
        <div>
          <h2 className="text-sm font-bold tracking-wide uppercase">
            Gravidade
          </h2>
          <div className="mt-2">
            <BarraGravidade nivel={4} />
          </div>
        </div>
        <div className="border-borda border-t-2 pt-4">
          <h2 className="text-sm font-bold tracking-wide uppercase">Origem</h2>
          <p className="mt-1 font-semibold">Modelo local · offline</p>
        </div>
      </div>

      <Secao titulo="Descrição">
        <p>
          Doença foliar muito comum no tomateiro. Começa pelas folhas mais
          velhas, próximas ao solo, e progride para cima. As lesões são escuras e
          apresentam anéis concêntricos característicos, que lembram um alvo. Em
          ataques severos causa desfolha intensa, expondo os frutos ao sol.
        </p>
      </Secao>

      <Secao titulo="Condições favoráveis">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-semibold">Temperatura</dt>
          <dd>24 a 29 °C</dd>
          <dt className="font-semibold">Umidade</dt>
          <dd>Alta, com molhamento foliar acima de 8 h</dd>
        </dl>
        <p className="mt-2">
          Alternância de períodos úmidos e secos favorece o ciclo. Comum em
          lavouras com adubação nitrogenada deficiente.
        </p>
      </Secao>

      <Secao titulo="Manejo">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Rotação de culturas por no mínimo 2 anos, evitando solanáceas.
          </li>
          <li>Eliminar restos culturais, que são fonte de inóculo.</li>
          <li>
            Irrigação por gotejamento em vez de aspersão, para reduzir o
            molhamento foliar.
          </li>
        </ul>
      </Secao>

      <div className="mt-6">
        <AvisoLegal />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <BotaoLink href="/" variante="secundario">
          Novo diagnóstico
        </BotaoLink>
      </div>
    </div>
  );
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
