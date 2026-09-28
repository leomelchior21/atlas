"use client";

import { ATLAS, ancestorsOf } from "@/content";
import { CONCEPTS } from "@/content/concepts";
import { formatYears } from "@/lib/format";
import { useAtlas, useMastery, childrenOf } from "@/store/atlas-store";
import { ExploreHint } from "./cards";
import { NodeEmblem } from "./NodeEmblem";
import { NodeIcon } from "./NodeIcon";

export function ConceptLanding({ nodeId }: { nodeId: string }) {
  const { actions, progress } = useAtlas();
  const node = ATLAS.byId[nodeId];
  const meta = node?.conceptId ? CONCEPTS[node.conceptId] : undefined;
  const mastery = useMastery(node?.conceptId ?? "");
  const record = node?.conceptId ? progress.concepts[node.conceptId] : undefined;

  if (!node || !meta) return null;

  const children = childrenOf(node.id);
  const parent = node.parentId ? ATLAS.byId[node.parentId] : undefined;
  const ancestors = ancestorsOf(node.id);

  return (
    <div className="viewport-fit flex h-full flex-col lg:flex-row">
      {/* left: identity + progress */}
      <aside className="shrink-0 border-b border-white/8 px-4 py-5 sm:px-6 lg:w-[286px] lg:border-b-0 lg:border-r lg:px-7 lg:py-8">
        <button
          type="button"
          onClick={() => actions.openParent(node.id)}
          className="group flex w-fit items-center gap-3 text-[10px] tracking-[0.26em] text-white/50 transition-colors hover:text-white"
        >
          <span aria-hidden="true" className="text-[12px]">
            ←
          </span>
          {parent ? `Voltar para ${parent.shortTitle}` : "Voltar ao Atlas"}
        </button>

        <p className="micro mt-6">
          {ancestors.map((ancestor) => (
            <span key={ancestor.id}>
              {ancestor.shortTitle}
              <span className="px-1.5 text-white/25" aria-hidden="true">
                ›
              </span>
            </span>
          ))}
        </p>

        <h1 className="mt-3 font-display text-[20px] font-light uppercase tracking-[0.14em] text-white">
          {node.title}
        </h1>
        <p className="mt-4 max-w-[420px] text-[12.5px] leading-[1.7] text-white/50">
          {meta.explanation}
        </p>

        <div className="mt-6 flex max-w-[420px] items-center gap-7">
          <Stat label="DOMÍNIO" value={`${Math.round(mastery.overall)}%`} />
          <Stat label="SEQUÊNCIA" value={String(record?.streak ?? 0)} />
          <Stat label="QUESTÕES" value={String(record?.attempts ?? 0)} />
        </div>

        <p className="mt-6 flex items-center gap-2.5 text-[10px] tracking-[0.18em] text-white/35">
          <EyeGlyph />
          Relevante para {formatYears(node.recommendedYears, false)}.
        </p>
      </aside>

      {/* center: emblem + doors */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 py-7 sm:px-6 lg:py-8">
        <h2 className="t-title text-center text-white">{node.title}</h2>

        <NodeEmblem id={node.id} className="h-40 w-40 sm:h-52 sm:w-52" />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => actions.openConcept(node.id)}
            className="btn btn-solid min-w-[168px] justify-between"
          >
            <span aria-hidden="true" className="text-[12px]">
              ▷
            </span>
            CONCEITO
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={() => actions.openMarathon(node.id)}
            className="btn min-w-[168px] justify-between"
          >
            <span aria-hidden="true" className="text-[12px]">
              ⚡
            </span>
            MARATONA
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {children.length ? (
          <button
            type="button"
            onClick={() => actions.openBranches(node.id)}
            className="group flex items-center gap-3 text-[10px] tracking-[0.26em] text-white/45 transition-colors hover:text-white"
          >
            <BranchGlyph />
            Explorar ramificações
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        ) : null}

        <ExploreHint>ESCOLHA COMO DESEJA EXPLORAR ESTE TERRITÓRIO</ExploreHint>
      </main>

      {/* right: branches */}
      {children.length ? (
        <aside className="shrink-0 border-t border-white/8 px-4 py-6 sm:px-6 lg:w-[300px] lg:border-t-0 lg:border-l lg:px-7 lg:py-8">
          <p className="micro">RAMIFICAÇÕES</p>
          <ul className="mt-4 flex flex-col">
            {children.map((child) => (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => actions.openNode(child.id)}
                  className="group flex w-full items-center gap-3.5 border-b border-white/6 py-3 text-left last:border-0"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-white/55">
                    <NodeIcon id={child.id} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/75 transition-colors group-hover:text-white">
                    {child.title}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[12px] text-white/30 transition-colors group-hover:text-white"
                  >
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col gap-1.5">
      <span className="text-[9px] tracking-[0.26em] text-white/35">{label}</span>
      <span className="tabular font-display text-[16px] text-white">{value}</span>
    </span>
  );
}

function EyeGlyph() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path
        d="M1.5 6c1.6-2.4 3.8-3.6 6.5-3.6S12.9 3.6 14.5 6c-1.6 2.4-3.8 3.6-6.5 3.6S3.1 8.4 1.5 6Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="8" cy="6" r="1.6" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function BranchGlyph() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
      <path
        d="M3 12V3m0 4h5.5m0 0V3m0 4v5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="3" cy="2.2" r="1.4" stroke="currentColor" strokeWidth="1" />
      <circle cx="8.5" cy="2.2" r="1.4" stroke="currentColor" strokeWidth="1" />
      <circle cx="8.5" cy="12" r="1.4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
