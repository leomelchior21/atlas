"use client";

import { ATLAS, ancestorsOf } from "@/content";
import { masteryLabel } from "@/engine/mastery";
import { PANEL_WIDTH } from "@/lib/atlas/viewport";

export function NodePanel({
  nodeId,
  masteryByNode,
  onSelect,
  onOpen,
  onClose,
}: {
  nodeId: string;
  masteryByNode: Record<string, number>;
  onSelect: (nodeId: string) => void;
  onOpen: (nodeId: string) => void;
  onClose: () => void;
}) {
  const node = ATLAS.byId[nodeId];
  if (!node) return null;

  const children = ATLAS.childrenOf[nodeId] ?? [];
  const ancestors = ancestorsOf(nodeId);
  const mastery = masteryByNode[nodeId] ?? 0;

  return (
    <aside
      className="pointer-events-auto absolute right-0 top-0 z-30 flex h-full flex-col border-l border-white/10 bg-black px-7 pb-7 pt-7 rise-in"
      style={{ width: PANEL_WIDTH }}
      aria-label={`Detalhes de ${node.title}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="micro">
          {ancestors.map((ancestor) => (
            <span key={ancestor.id}>
              {ancestor.shortTitle}
              <span className="px-2 text-white/25" aria-hidden="true">
                ›
              </span>
            </span>
          ))}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="-mt-1 shrink-0 text-[15px] leading-none text-white/40 transition-colors hover:text-white"
        >
          ×
        </button>
      </div>

      <h2
        className={`mt-6 font-display font-light leading-[1.2] text-white ${
          node.depth <= 2
            ? "text-[21px] tracking-[0.12em] uppercase"
            : "text-[19px] tracking-[0.02em]"
        }`}
      >
        {node.title}
      </h2>

      {node.hasConcept ? (
        <p className="mt-4 text-[12.5px] leading-[1.6] text-white/45">
          Conceito interativo e maratona infinita de exercícios.
        </p>
      ) : null}

      <span className="mt-6 mb-4 block h-px w-full bg-white/10" />

      {children.length ? (
        <ul className="scroll-thin -mr-3 flex min-h-0 flex-1 flex-col overflow-y-auto pr-3">
          {children.map((child) => {
            const childMastery = masteryByNode[child.id] ?? 0;
            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onSelect(child.id)}
                  className="group flex w-full items-center gap-3 py-[7px] text-left"
                >
                  <span
                    aria-hidden="true"
                    className={`h-[7px] w-[7px] shrink-0 rounded-full border transition-colors ${
                      child.hasConcept
                        ? childMastery >= 70
                          ? "border-white bg-white"
                          : "border-white/70 bg-white/20"
                        : child.status === "placeholder"
                          ? "border-white/35 group-hover:border-white/80"
                          : "border-white/70"
                    }`}
                  />
                  <span className="flex-1 truncate text-[13px] tracking-[0.01em] text-white/72 transition-colors group-hover:text-white">
                    {child.title}
                  </span>
                  {childMastery > 0 ? (
                    <span className="tabular shrink-0 text-[10px] tracking-[0.08em] text-white/35">
                      {Math.round(childMastery)}%
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col gap-2">
          {mastery > 0 ? (
            <>
              <span className="flex items-baseline justify-between">
                <span className="text-[10px] tracking-[0.24em] text-white/35">DOMÍNIO</span>
                <span className="tabular font-display text-[15px] text-white">
                  {Math.round(mastery)}%
                </span>
              </span>
              <span className="text-[10px] tracking-[0.24em] text-white/30">
                {masteryLabel(mastery)}
              </span>
            </>
          ) : (
            <p className="text-[12.5px] leading-[1.6] text-white/35">
              Este ponto ainda não foi explorado.
            </p>
          )}
        </div>
      )}

      {node.status === "placeholder" ? (
        <p className="mt-4 text-[11.5px] leading-relaxed text-white/30">
          Território ainda em mapeamento.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => onOpen(nodeId)}
        className={`btn mt-6 w-full justify-between ${
          node.hasConcept || children.length || node.status === "placeholder"
            ? "btn-solid"
            : ""
        }`}
      >
        {node.hasConcept ? "ABRIR CONCEITO" : "ABRIR"}
        <span aria-hidden="true">→</span>
      </button>
    </aside>
  );
}
