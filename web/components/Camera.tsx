"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Botao } from "@/components/Botao";

export type Captura = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

type Estado =
  | "parada"
  | "abrindo"
  | "ativa"
  | "negada"
  | "sem_camera"
  | "sem_suporte"
  | "falhou";

const MENSAGEM: Record<Exclude<Estado, "parada" | "abrindo" | "ativa">, string> = {
  negada:
    "Permissão de câmera negada. Libere o acesso nas configurações do navegador para este site.",
  sem_camera: "Nenhuma câmera encontrada neste aparelho.",
  sem_suporte:
    "Este navegador não expõe a câmera. Em celular, a câmera exige conexão segura (https).",
  falhou: "Não foi possível abrir a câmera. Feche outros apps que a estejam usando.",
};

/**
 * Câmera do scanner.
 *
 * `facingMode: environment` pede a câmera traseira - é para ela que o
 * agrônomo aponta a folha. Não é garantia: em alguns aparelhos o navegador
 * ignora e entrega a frontal, e não há como forçar.
 *
 * A captura sai em resolução NATIVA do vídeo, sem redimensionar aqui. O
 * `drawImage` do navegador não redimensiona igual ao treino, e deixar essa
 * conta para ele desalinharia a imagem do modelo em relação à que ele viu -
 * silenciosamente. Quem reduz é `lib/preprocessamento.ts`, à mão, com paridade
 * testada contra o Python.
 *
 * O stream é encerrado ao desmontar. Sem isso a luz da câmera fica acesa
 * depois de sair da tela, o que assusta o usuário com razão e queima bateria
 * no campo, que é onde ela é mais escassa.
 */
export function Camera({
  aoCapturar,
  ocupado = false,
  legenda,
}: {
  aoCapturar: (captura: Captura) => void;
  ocupado?: boolean;
  legenda: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<Estado>("parada");

  const encerrar = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => encerrar, [encerrar]);

  async function abrir() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado("sem_suporte");
      return;
    }

    setEstado("abrindo");
    try {
      const midia = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });
      stream.current = midia;
      if (video.current) {
        video.current.srcObject = midia;
        await video.current.play();
      }
      setEstado("ativa");
    } catch (erro) {
      const nome = (erro as DOMException)?.name;
      setEstado(
        nome === "NotAllowedError" || nome === "SecurityError"
          ? "negada"
          : nome === "NotFoundError" || nome === "OverconstrainedError"
            ? "sem_camera"
            : "falhou",
      );
    }
  }

  function capturar() {
    const v = video.current;
    if (!v || !v.videoWidth) return;

    const tela = document.createElement("canvas");
    tela.width = v.videoWidth;
    tela.height = v.videoHeight;
    const contexto = tela.getContext("2d", { willReadFrequently: false });
    if (!contexto) return;

    contexto.drawImage(v, 0, 0);
    const { data, width, height } = contexto.getImageData(
      0,
      0,
      tela.width,
      tela.height,
    );
    aoCapturar({ data, width, height });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-borda-forte bg-superficie relative aspect-square w-full overflow-hidden rounded-xl border-2">
        <video
          ref={video}
          playsInline
          muted
          aria-label="Visor da câmera"
          className={`size-full object-cover ${estado === "ativa" ? "" : "hidden"}`}
        />

        <Moldura ativa={estado === "ativa"} />

        {estado !== "ativa" && (
          <p className="text-texto-suave absolute inset-x-6 bottom-6 text-center text-sm font-semibold">
            {estado === "abrindo" ? "Abrindo a câmera…" : legenda}
          </p>
        )}
      </div>

      {estado !== "ativa" && estado !== "parada" && estado !== "abrindo" && (
        <p
          role="alert"
          className="border-alerta bg-alerta-fundo rounded-lg border-2 p-4 text-sm"
        >
          {MENSAGEM[estado]}
        </p>
      )}

      {estado === "ativa" ? (
        <Botao onClick={capturar} disabled={ocupado} data-teste="capturar">
          <IconeCamera />
          {ocupado ? "Analisando…" : "Capturar"}
        </Botao>
      ) : (
        <Botao
          onClick={abrir}
          disabled={estado === "abrindo" || estado === "sem_suporte"}
          data-teste="abrir-camera"
        >
          <IconeCamera />
          {estado === "parada" || estado === "abrindo"
            ? "Abrir câmera"
            : "Tentar de novo"}
        </Botao>
      )}
    </div>
  );
}

/**
 * Moldura-guia. Os cantos marcam onde a folha deve ficar: enquadramento
 * consistente é o que faz o recorte central de 224 px pegar a folha, e não o
 * chão em volta.
 *
 * Com a câmera ligada os cantos ficam brancos, não verdes. A cena de um
 * agrônomo é folhagem: verde sobre verde é justamente onde a guia some, e ela
 * some sob sol forte, que é quando ele mais precisa dela. Parados, sobre o
 * cinza claro do visor vazio, os brancos é que sumiriam - daí a troca.
 */
function Moldura({ ativa }: { ativa: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-6">
      {(
        [
          "left-0 top-0 border-l-4 border-t-4 rounded-tl-lg",
          "right-0 top-0 border-r-4 border-t-4 rounded-tr-lg",
          "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-lg",
          "right-0 bottom-0 border-r-4 border-b-4 rounded-br-lg",
        ] as const
      ).map((posicao) => (
        <span
          key={posicao}
          aria-hidden="true"
          className={`absolute size-10 ${ativa ? "border-white" : "border-primaria"} ${posicao}`}
        />
      ))}
    </div>
  );
}

function IconeCamera() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
