"use client";

import type { ReactNode } from "react";
import type { AtlasNode } from "@/types/content";
import { NodeIcon } from "./NodeIcon";

export function TopicCard({
  node,
  onOpen,
  meta,
}: {
  node: AtlasNode;
  onOpen: () => void;
  meta?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-[14px] border border-white/12 bg-white/[0.015] px-4 py-3.5 text-left transition-colors duration-200 hover:border-white/35 hover:bg-white/[0.035]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-white/15 text-white/75 transition-colors group-hover:border-white/35 group-hover:text-white">
        <NodeIcon id={node.id} className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[12.5px] font-normal uppercase tracking-[0.12em] text-white/90">
          {node.title}
        </span>
        {node.blurb ? (
          <span className="mt-0.5 block truncate text-[11.5px] leading-relaxed text-white/45">
            {node.blurb}
          </span>
        ) : null}
      </span>

      {meta ? <span className="shrink-0">{meta}</span> : null}

      <span
        aria-hidden="true"
        className="shrink-0 text-[13px] text-white/30 transition-colors group-hover:text-white"
      >
        →
      </span>
    </button>
  );
}

export function ProgressCard({
  explored,
  total,
  label,
}: {
  explored: number;
  total: number;
  label: string;
}) {
  const percent = total > 0 ? Math.round((explored / total) * 100) : 0;
  return (
    <div className="rounded-[14px] border border-white/12 bg-white/[0.02] px-4 py-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[9.5px] tracking-[0.24em] text-white/45">SEU PROGRESSO</span>
        <span className="tabular font-display text-[15px] text-white">{percent}%</span>
      </div>
      <span className="mt-3 block h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-white transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </span>
      <p className="mt-3 text-[11px] leading-relaxed text-white/40">
        {explored} de {total} {label} explorados
      </p>
    </div>
  );
}

export function ExploreHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 py-4 text-white/35">
      <PointerGlyph />
      <span className="text-[10px] tracking-[0.3em] uppercase">{children}</span>
    </div>
  );
}

function PointerGlyph() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <path
        d="M7 2.5v8.2M7 10.7 4.9 8.6a1.3 1.3 0 0 0-1.9 1.8l4.1 4.9c.6.8 1.6 1.2 2.6 1.2h3.1a3.2 3.2 0 0 0 3.2-3.2v-2.7c0-.9-.7-1.6-1.6-1.6H7"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 8.8V4.4a1.4 1.4 0 0 0-2.8 0v5.9"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
