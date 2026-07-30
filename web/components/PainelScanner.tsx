"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BotaoLink } from "@/components/Botao";
import { Camera, type Captura } from "@/components/Camera";
import { SeletorCultura } from "@/components/SeletorCultura";
import {
  carregarClassificador,
  type Classificador,
} from "@/lib/classificador.ts";
import {
  diagnosticarImagem,
  rotaDoLaudo,
  type ResultadoDaImagem,
} from "@/lib/diagnostico-por-imagem.ts";
import { listarCulturas } from "@/lib/diagnostico.ts";

const CULTURAS = listarCulturas();

/**
 * Camada 1: foto -> laudo, tudo no aparelho.
 *
 * O classificador entra por `carregarClassificador`, que hoje devolve null
 * porque o modelo da fase 4b ainda não existe. Isso não é erro e não é tratado
 * como erro: a tela diz o que falta e manda o agrônomo para o fluxo por
 * sintomas, que resolve o problema dele agora.
 *
 * Quando o ONNX chegar, nada aqui muda.
 */
export function PainelScanner() {
  const router = useRouter();
  const [culturaId, setCulturaId] = useState("Tomato");
  const [classificador, setClassificador] = useState<Classificador | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDaImagem | null>(null);

  const cultura = CULTURAS.find((c) => c.id === culturaId);

  useEffect(() => {
    let vivo = true;
    carregarClassificador()
      .then((c) => vivo && setClassificador(c))
      .catch(() => vivo && setClassificador(null));
    return () => {
      vivo = false;
    };
  }, []);

  async function analisar(captura: Captura) {
    setAnalisando(true);
    setResultado(null);
    try {
      const r = await diagnosticarImagem(captura, culturaId, classificador);
      setResultado(r);
      if (r.estado === "diagnosticado" || r.estado === "nao_calibrado") {
        router.push(rotaDoLaudo(r.previsao));
      }
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <SeletorCultura
        valor={culturaId}
        aoTrocar={(c) => {
          setCulturaId(c);
          setResultado(null);
        }}
        ajuda="Informar a cultura restringe o modelo às doenças que realmente ocorrem nela - reduz bastante o erro."
      />

      <Camera
        aoCapturar={analisar}
        ocupado={analisando}
        legenda={
          cultura
            ? `Centralize a folha de ${cultura.nome.toLowerCase()}`
            : "Centralize a folha"
        }
      />

      {resultado && <Aviso resultado={resultado} />}

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="bg-borda h-0.5 flex-1" />
        <span className="text-texto-suave text-sm font-semibold">ou</span>
        <span className="bg-borda h-0.5 flex-1" />
      </div>

      <BotaoLink href="/sintomas" variante="secundario">
        Buscar por sintomas
      </BotaoLink>
    </div>
  );
}

function Aviso({ resultado }: { resultado: ResultadoDaImagem }) {
  if (resultado.estado === "sem_modelo") {
    return (
      <Caixa titulo="O modelo ainda não existe">
        <p>
          A câmera e o pré-processamento já funcionam e são os mesmos que o
          treino vai usar. Falta treinar o modelo e medir a acurácia numa
          validação de campo honesta - até lá, o app não chuta um diagnóstico.
        </p>
        <p className="mt-2">
          O fluxo por sintomas cobre 29 doenças e funciona agora, sem foto.
        </p>
      </Caixa>
    );
  }

  if (resultado.estado === "recusado") {
    return (
      <Caixa titulo="Não reconheço esta imagem">
        <p>{resultado.motivo}</p>
        <p className="mt-2">
          Recusar é a resposta certa aqui: um palpite com aparência de laudo
          seria pior que admitir o desconhecimento.
        </p>
      </Caixa>
    );
  }

  if (resultado.estado === "sem_resposta") {
    return (
      <Caixa titulo="Nada compatível com esta cultura">
        <p>
          O modelo não viu nada parecido com as doenças desta cultura. Confira
          se a cultura selecionada é a certa, ou use o fluxo por sintomas.
        </p>
      </Caixa>
    );
  }

  return null;
}

function Caixa({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className="border-alerta bg-alerta-fundo rounded-xl border-2 p-4 text-sm"
    >
      <h2 className="text-base font-bold">{titulo}</h2>
      <div className="mt-1">{children}</div>
    </div>
  );
}
