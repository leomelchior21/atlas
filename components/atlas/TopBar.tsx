"use client";

import { ATLAS, pathToNode } from "@/content";
import { useAtlas } from "@/store/atlas-store";
import { YEAR_LABELS } from "@/types/content";
import { AtlasMark } from "./AtlasLogo";

export function TopBar({
  compact,
  onToggleConnections,
  connectionsOpen,
}: {
  compact: boolean;
  onToggleConnections: () => void;
  connectionsOpen: boolean;
}) {
  const { view, actions, studentName, studentYear, progress, selectedId } = useAtlas();

  const nodeId = view.kind === "map" ? selectedId : view.nodeId;
  const path = nodeId ? pathToNode(nodeId) : [];
  const atRoot = view.kind === "map" && !selectedId;
  const selected = selectedId ? ATLAS.byId[selectedId] : undefined;
  const canLearn = Boolean(selected?.hasConcept);

  return (
    <header className="relative z-40 flex h-[72px] shrink-0 items-center justify-between gap-6 border-b border-white/8 px-7">
      <div className="flex min-w-0 items-center gap-5">
        <button
          type="button"
          onClick={actions.backToMap}
          className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80"
          aria-label="Ir para o mapa"
        >
          <AtlasMark size={30} />
          <span
            className="hidden font-display font-light text-white sm:inline"
            style={{ fontSize: 14, letterSpacing: "0.6em", paddingLeft: "0.1em" }}
          >
            ATLAS
          </span>
        </button>

        <span className="hidden h-5 w-px bg-white/12 lg:block" aria-hidden="true" />

        <nav aria-label="Trilha" className="flex min-w-0 items-center gap-2 text-[11px] tracking-[0.22em]">
          {atRoot ? (
            <span className="text-white/45">VISÃO GERAL</span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  actions.clearSelection();
                  actions.backToMap();
                }}
                className="shrink-0 text-white/35 transition-colors hover:text-white"
              >
                ← ATLAS
              </button>
              {path.map((node, index) => (
                <span key={node.id} className="flex min-w-0 items-center gap-2">
                  <span className="text-white/20" aria-hidden="true">
                    ›
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (index === path.length - 1) return;
                      actions.selectNode(node.id);
                    }}
                    className={`max-w-[150px] truncate uppercase transition-colors ${
                      index === path.length - 1
                        ? "text-white"
                        : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    {node.shortTitle}
                  </button>
                </span>
              ))}
            </>
          )}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-6">
        {!compact ? (
          <nav aria-label="Navegação principal" className="hidden items-center gap-7 lg:flex">
            <NavButton
              label="EXPLORAR"
              active={view.kind === "map"}
              onClick={() => {
                actions.clearSelection();
                actions.backToMap();
              }}
            />
            <NavButton
              label="APRENDER"
              active={view.kind === "landing" || view.kind === "concept"}
              disabled={!canLearn}
              onClick={() => selected?.id && actions.openNode(selected.id)}
            />
            <NavButton label="CONECTAR" active={connectionsOpen} onClick={onToggleConnections} />
          </nav>
        ) : null}

        <div className="flex items-center gap-4">
          <span className="tabular hidden text-[11px] text-white/45 sm:inline">
            {progress.xp} XP
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-[10px] tracking-[0.06em] text-white/75"
            title={`${studentName} · ${YEAR_LABELS[studentYear]}`}
            aria-label={`Estudante ${studentName || "anônimo"}, ${YEAR_LABELS[studentYear]}`}
          >
            {(studentName || "A").slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}

function NavButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={`text-[11px] tracking-[0.26em] transition-colors ${
        disabled
          ? "cursor-default text-white/18"
          : active
            ? "text-white"
            : "text-white/45 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function ConnectionsPanel({
  nodeId,
  onClose,
}: {
  nodeId: string | null;
  onClose: () => void;
}) {
  const { actions } = useAtlas();
  const node = nodeId ? ATLAS.byId[nodeId] : null;
  const outgoing = node ? node.connections.map((id) => ATLAS.byId[id]).filter(Boolean) : [];
  const incoming = node
    ? ATLAS.nodes.filter((candidate) => candidate.connections.includes(node.id)).slice(0, 10)
    : [];

  return (
    <aside className="absolute right-0 top-0 z-40 flex h-full w-[336px] flex-col border-l border-white/10 bg-black/95 px-7 pb-8 pt-6 rise-in">
      <div className="flex items-center justify-between">
        <p className="micro">CONEXÕES</p>
        <button
          type="button"
          onClick={onClose}
          className="text-[15px] leading-none text-white/40 transition-colors hover:text-white"
          aria-label="Fechar conexões"
        >
          ×
        </button>
      </div>

      <h2 className="mt-6 font-display text-[20px] font-light leading-tight text-white">
        {node?.title ?? "Visão geral"}
      </h2>
      <p className="mt-3 text-[12px] leading-relaxed text-white/45">
        O mapa mostra apenas o nível em foco. Aqui ficam os vínculos entre áreas — inclusive os
        que cruzam Matemática, Física e Química.
      </p>

      <div className="mt-8 flex flex-col gap-7 overflow-y-auto scroll-thin pr-1">
        <ConnectionGroup title="LEVA A" items={outgoing as never[]} onActivate={actions.selectNode} />
        <ConnectionGroup title="VEM DE" items={incoming as never[]} onActivate={actions.selectNode} />
      </div>

      <button
        type="button"
        onClick={() => {
          actions.clearSelection();
          actions.backToMap();
          onClose();
        }}
        className="btn mt-auto"
      >
        ← VOLTAR AO MAPA
      </button>
    </aside>
  );
}

function ConnectionGroup({
  title,
  items,
  onActivate,
}: {
  title: string;
  items: Array<{ id: string; title: string; subject: string; status: string }>;
  onActivate: (nodeId: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="flex flex-col gap-2">
        <p className="micro">{title}</p>
        <p className="text-[12px] text-white/28">Nada por aqui ainda.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="micro">{title}</p>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onActivate(item.id)}
              className="group flex w-full items-center gap-3 border-b border-white/6 py-2.5 text-left last:border-0"
            >
              <span
                aria-hidden="true"
                className={`h-[6px] w-[6px] rounded-full ${
                  item.status === "placeholder" ? "border border-white/45" : "bg-white/80"
                }`}
              />
              <span className="flex-1 truncate text-[12.5px] text-white/72 group-hover:text-white">
                {item.title}
              </span>
              <span className="text-[9px] tracking-[0.2em] text-white/28">
                {item.subject === "math" ? "MAT" : item.subject === "physics" ? "FÍS" : "QUÍ"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
