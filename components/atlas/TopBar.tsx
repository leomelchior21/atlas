"use client";

import { ATLAS } from "@/content";
import { useAtlas } from "@/store/atlas-store";
import { YEAR_LABELS } from "@/types/content";
import { AtlasMark } from "./AtlasLogo";

export function TopBar({ onEnter }: { onEnter: () => void }) {
  const { view, actions, studentName, studentYear, progress } = useAtlas();

  const nodeId = view.kind !== "home" ? view.nodeId : null;
  const node = nodeId ? ATLAS.byId[nodeId] : undefined;
  const canLearn = Boolean(node?.conceptId);
  const hasStudent = Boolean(studentName);

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/8 bg-black px-4 sm:px-6 lg:h-16 lg:px-8">
      <button
        type="button"
        onClick={actions.goHome}
        className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        aria-label="Início"
      >
        <AtlasMark size={24} />
        <span
          className="hidden font-display font-light text-white sm:inline"
          style={{ fontSize: 13, letterSpacing: "0.58em", paddingLeft: "0.1em" }}
        >
          ATLAS
        </span>
      </button>

      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        <nav aria-label="Navegação principal" className="hidden items-center gap-5 md:flex">
          <NavButton
            label="INÍCIO"
            active={view.kind === "home"}
            onClick={actions.goHome}
          />
          <NavButton
            label="EXPLORAR"
            active={view.kind === "subject" || view.kind === "node"}
            onClick={() => actions.openSubject(nodeId ?? "math-root")}
          />
          {canLearn ? (
            <NavButton
              label="APRENDER"
              active={view.kind === "landing" || view.kind === "concept"}
              onClick={() => nodeId && actions.openNode(nodeId)}
            />
          ) : null}
        </nav>

        {hasStudent ? (
          <span
            className="flex items-center gap-3"
            title={`${studentName} · ${YEAR_LABELS[studentYear]}`}
          >
            <span className="tabular hidden text-[11px] text-white/45 sm:inline">
              {progress.xp} XP
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-[10px] tracking-[0.06em] text-white/75"
              aria-label={`Estudante ${studentName}, ${YEAR_LABELS[studentYear]}`}
            >
              {studentName.slice(0, 2).toUpperCase()}
            </span>
          </span>
        ) : (
          <button type="button" onClick={onEnter} className="btn h-9 min-h-0 px-5">
            ENTRAR
          </button>
        )}
      </div>
    </header>
  );
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`text-[10.5px] tracking-[0.24em] transition-colors ${
        active ? "text-white" : "text-white/45 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
