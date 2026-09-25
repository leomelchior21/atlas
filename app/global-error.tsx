"use client";

export default function AtlasGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)" }}>
            ATLAS
          </p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 300,
              letterSpacing: "0.06em",
              lineHeight: 1.4,
              marginTop: 24,
            }}
          >
            NÃO FOI POSSÍVEL CARREGAR O ATLAS.
          </h1>
          <p
            style={{
              marginTop: 18,
              fontFamily: "monospace",
              fontSize: 11.5,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {error.message || "Erro desconhecido"}
            {error.digest ? ` (${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              minHeight: 44,
              padding: "0 24px",
              borderRadius: 999,
              border: "1px solid #fff",
              background: "#fff",
              color: "#000",
              fontSize: 11,
              letterSpacing: "0.24em",
              cursor: "pointer",
            }}
          >
            TENTAR DE NOVO
          </button>
        </div>
      </body>
    </html>
  );
}
