/**
 * Aviso legal do laudo.
 *
 * Fica visivel na tela, nao escondido num rodape: no Brasil a aquisicao e a
 * aplicacao de defensivos exigem receituario agronomico, e os ingredientes
 * ativos que o app cita sao referencia tecnica, nao prescricao.
 *
 * `origem` controla o reforco: um laudo vindo da analise avancada nao passou
 * por curadoria manual, e o leitor precisa saber disso.
 */
export function AvisoLegal({
  origem = "curada",
}: {
  origem?: "curada" | "avancada";
}) {
  return (
    <aside className="border-alerta bg-alerta-fundo rounded-lg border-2 p-4">
      <h2 className="text-alerta flex items-center gap-2 text-base font-bold">
        <IconeAlerta />
        Aviso
      </h2>

      {origem === "avancada" && (
        <p className="mt-2 text-sm font-semibold">
          Este laudo foi gerado por análise automática de imagem e{" "}
          <strong>não passou por curadoria</strong>. Trate-o como hipótese
          inicial, não como diagnóstico.
        </p>
      )}

      <p className="mt-2 text-sm">
        Sistema educativo - não substitui a avaliação de um engenheiro
        agrônomo. No Brasil, a aquisição e a aplicação de defensivos agrícolas
        exigem <strong>receituário agronômico</strong>. Os ingredientes ativos
        citados são referência técnica; confira o registro válido para a sua
        cultura e região no <strong>AGROFIT/MAPA</strong> antes de qualquer
        aplicação.
      </p>
    </aside>
  );
}

function IconeAlerta() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 10v4M12 17.2v.1" />
    </svg>
  );
}
