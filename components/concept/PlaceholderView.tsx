"use client";

import { ATLAS } from "@/content";
import { NodeEmblem } from "@/components/atlas/NodeEmblem";

export function PlaceholderView({ nodeId, onBack }: { nodeId: string; onBack: () => void }) {
  const node = ATLAS.byId[nodeId];

  return (
    <div className="viewport-fit flex h-full flex-col items-center justify-center gap-8 bg-black px-6 py-10 text-center">
      <NodeEmblem id={nodeId} className="h-32 w-32 opacity-70" />

      <div>
        <p className="micro mb-5">{node?.title ?? ""}</p>
        <h1 className="mx-auto max-w-[520px] font-display text-[22px] font-light leading-[1.45] tracking-[0.06em] text-white sm:text-[26px]">
          ESTE TERRITÓRIO AINDA ESTÁ SENDO MAPEADO.
        </h1>
        <p className="mt-5 text-[11px] tracking-[0.4em] text-white/40">EM BREVE</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button type="button" onClick={onBack} className="btn">
          ← VOLTAR AO ATLAS
        </button>
        <p className="max-w-[400px] text-[11.5px] leading-relaxed text-white/30">
          Este ponto do mapa já tem nome e lugar definidos. O conteúdo chega quando a Geometria
          estiver completa.
        </p>
      </div>
    </div>
  );
}
