"use client";

import { useEffect } from "react";

export default function AtlasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ATLAS]", error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black px-8 text-center">
      <p className="micro mb-6">ATLAS</p>
      <h1 className="max-w-[520px] font-display text-[24px] font-light leading-[1.4] tracking-[0.06em] text-white">
        O MAPA ENCONTROU UM ERRO INESPERADO.
      </h1>
      <p className="mt-5 max-w-[560px] font-mono text-[11.5px] leading-relaxed text-white/45">
        {error.message || "Erro desconhecido"}
        {error.digest ? ` (${error.digest})` : ""}
      </p>
      <div className="mt-10 flex items-center gap-3">
        <button type="button" onClick={reset} className="btn btn-solid">
          TENTAR DE NOVO
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn"
        >
          RECARREGAR
        </button>
      </div>
      <p className="mt-8 max-w-[520px] text-[11.5px] leading-relaxed text-white/30">
        Se o erro persistir, apague a pasta <span className="text-white/50">.next</span> e rode{" "}
        <span className="text-white/50">npm run dev</span> novamente.
      </p>
    </div>
  );
}
