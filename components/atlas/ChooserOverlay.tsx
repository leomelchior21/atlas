"use client";

import { ATLAS } from "@/content";
import { hasChildren } from "@/store/atlas-store";
import { CONCEPTS } from "@/content/concepts";
import { masteryLabel } from "@/engine/mastery";
import { useAtlas, useMastery } from "@/store/atlas-store";
import { YEAR_SHORT } from "@/types/content";

export function ChooserOverlay({ nodeId }: { nodeId: string }) {
  const { actions, progress, studentYear } = useAtlas();
  const node = ATLAS.byId[nodeId];
  const mastery = useMastery(node?.conceptId ?? "");
  const record = node?.conceptId ? progress.concepts[node.conceptId] : undefined;
  const meta = node?.conceptId ? CONCEPTS[node.conceptId] : undefined;
  const domain = node?.domainId ? ATLAS.byId[node.domainId] : undefined;

  if (!node || !meta) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.86) 34%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0) 88%)",
        }}
      />

      <div className="pointer-events-auto relative z-10 ml-[6vw] w-[min(460px,72vw)] rise-in">
        <p className="micro mb-5">
          {ATLAS.byId[node.subject === "math" ? "math-root" : node.subject === "physics" ? "physics-root" : "chemistry-root"]?.title}{" "}
          <span className="text-white/25">›</span> {domain?.title ?? ""}
        </p>

        <h2 className="font-display text-[34px] font-light leading-[1.14] tracking-[0.02em] text-white xl:text-[40px]">
          {node.title}
        </h2>

        <p className="mt-5 max-w-[400px] text-[13.5px] leading-[1.75] text-white/55">
          {meta.explanation}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Stat label="DOMÍNIO" value={`${Math.round(mastery.overall)}%`} />
          <Stat label="SEQUÊNCIA" value={String(record?.streak ?? 0)} />
          <Stat label="QUESTÕES" value={String(record?.attempts ?? 0)} />
          <span className="text-[9.5px] tracking-[0.24em] text-white/35">
            {masteryLabel(mastery.overall)}
          </span>
        </div>

        <div className="mt-3 max-w-[400px]">
          <span className="relative block h-px w-full bg-white/12">
            <span
              className="absolute inset-y-0 left-0 bg-white/70"
              style={{ width: `${Math.round(mastery.overall)}%` }}
            />
          </span>
          {mastery.nextStep ? (
            <p className="mt-3 text-[11px] tracking-[0.06em] text-white/35">{mastery.nextStep}</p>
          ) : null}
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => actions.openConcept(nodeId)}
            className="btn btn-solid min-w-[190px] justify-between"
          >
            CONCEITO
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={() => actions.openMarathon(nodeId)}
            className="btn min-w-[190px] justify-between"
          >
            MARATONA
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {hasChildren(nodeId) ? (
          <button
            type="button"
            onClick={() => actions.exploreChildren(nodeId)}
            className="mt-5 text-[10px] tracking-[0.28em] text-white/40 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white"
          >
            EXPLORAR RAMIFICAÇÕES →
          </button>
        ) : null}

        <div className="mt-7 flex items-center gap-6">
          <button
            type="button"
            onClick={actions.backToMap}
            className="text-[10px] tracking-[0.28em] text-white/40 transition-colors hover:text-white"
          >
            ← VOLTAR AO MAPA
          </button>
          <span className="text-[10px] tracking-[0.2em] text-white/25">
            relevante para {node.recommendedYears.map((year) => YEAR_SHORT[year]).join(" · ")} ·
            você está no {YEAR_SHORT[studentYear]}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-[9px] tracking-[0.24em] text-white/35">{label}</span>
      <span className="tabular font-display text-[15px] text-white">{value}</span>
    </span>
  );
}
