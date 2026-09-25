"use client";

import { ATLAS } from "@/content";

export function PlaceholderView({ nodeId, onBack }: { nodeId: string; onBack: () => void }) {
  const node = ATLAS.byId[nodeId];
  const depth = node?.depth ?? 2;
  const radius = depth <= 1 ? 78 : depth === 2 ? 44 : 26;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black px-8">
      <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true" className="mb-10">
        <g className="orbit-slow">
          <circle
            cx="120"
            cy="120"
            r={radius + 30}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="2 12"
          />
          <circle cx="120" cy={120 - radius - 30} r="2.4" fill="#ffffff" fillOpacity="0.8" />
        </g>
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
        <circle className="breathe" cx="120" cy="120" r={radius * 0.42} fill="#ffffff" fillOpacity="0.06" />
        <circle
          cx="120"
          cy="120"
          r={depth <= 2 ? 7 : 4.5}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.75"
          strokeWidth="1.2"
        />
        <circle cx="120" cy="120" r={2} fill="#ffffff" fillOpacity="0.6" />
      </svg>

      <p className="micro mb-6">{node?.title ?? ""}</p>

      <h1 className="max-w-[520px] text-center font-display text-[24px] font-light leading-[1.4] tracking-[0.06em] text-white">
        ESTE TERRITÓRIO AINDA ESTÁ SENDO MAPEADO.
      </h1>
      <p className="mt-5 text-[12px] tracking-[0.4em] text-white/40">EM BREVE</p>

      <div className="mt-12 flex flex-col items-center gap-4">
        <button type="button" onClick={onBack} className="btn">
          ← VOLTAR AO ATLAS
        </button>
        <p className="max-w-[380px] text-center text-[11.5px] leading-relaxed text-white/30">
          Este ponto do mapa já tem nome e lugar definidos. O conteúdo chega quando a Geometria
          estiver completa.
        </p>
      </div>
    </div>
  );
}
