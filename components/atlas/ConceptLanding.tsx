"use client";

import { ATLAS, ancestorsOf } from "@/content";
import { CONCEPTS } from "@/content/concepts";
import { masteryLabel } from "@/engine/mastery";
import { useAtlas, useMastery, hasChildren } from "@/store/atlas-store";
import { YEAR_SHORT, type FunctionalConceptId } from "@/types/content";

export function ConceptLanding({ nodeId }: { nodeId: string }) {
  const { actions, progress, studentYear } = useAtlas();
  const node = ATLAS.byId[nodeId];
  const meta = node?.conceptId ? CONCEPTS[node.conceptId] : undefined;
  const mastery = useMastery(node?.conceptId ?? "");
  const record = node?.conceptId ? progress.concepts[node.conceptId] : undefined;

  if (!node || !meta) return null;
  const ancestors = ancestorsOf(nodeId);

  return (
    <div className="absolute inset-0 z-30 bg-black fade-in">
      <div className="viewport-fit flex h-full w-full flex-col lg:flex-row">
        {/* left: the decision */}
        <div className="flex w-full flex-col justify-center px-7 py-6 lg:w-[46%] lg:pl-10 xl:w-[42%]">
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

          <h1 className="t-title mt-5 text-white">{node.title.toUpperCase()}</h1>

          <p className="t-body mt-5 max-w-[420px]">{meta.explanation}</p>

          <span className="mt-7 mb-5 block h-px w-full max-w-[420px] bg-white/10" />

          <div className="flex max-w-[420px] items-center gap-7">
            <Stat label="DOMÍNIO" value={`${Math.round(mastery.overall)}%`} />
            <Stat label="SEQUÊNCIA" value={String(record?.streak ?? 0)} />
            <Stat label="QUESTÕES" value={String(record?.attempts ?? 0)} />
            <span className="hidden text-[10px] tracking-[0.22em] text-white/35 xl:inline">
              {masteryLabel(mastery.overall)}
            </span>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => actions.openConcept(nodeId)}
              className="btn btn-solid min-w-[186px] justify-between"
            >
              CONCEITO
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={() => actions.openMarathon(nodeId)}
              className="btn min-w-[186px] justify-between"
            >
              MARATONA
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            {hasChildren(nodeId) ? (
              <button
                type="button"
                onClick={() => actions.selectNode(nodeId)}
                className="text-[10px] tracking-[0.26em] text-white/40 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white"
              >
                EXPLORAR RAMIFICAÇÕES
              </button>
            ) : null}
            <button
              type="button"
              onClick={actions.backToMap}
              className="text-[10px] tracking-[0.26em] text-white/40 transition-colors hover:text-white"
            >
              ← VOLTAR AO MAPA
            </button>
            <span className="text-[10px] tracking-[0.2em] text-white/30">
              relevante para {node.recommendedYears.map((year) => YEAR_SHORT[year]).join(" · ")} ·
              você está no {YEAR_SHORT[studentYear]}
            </span>
          </div>
        </div>

        {/* right: one calm abstract representation */}
        <div className="hidden min-h-0 flex-1 items-center justify-center lg:flex">
          <LandingVisual conceptId={meta.id} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col gap-1.5">
      <span className="text-[9.5px] tracking-[0.26em] text-white/35">{label}</span>
      <span className="tabular font-display text-[17px] text-white">{value}</span>
    </span>
  );
}

/* ------------------------------------------------------------- visuals */

const SIZE = 340;

function LandingVisual({ conceptId }: { conceptId: FunctionalConceptId }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg
        viewBox="0 0 200 200"
        width={SIZE}
        height={SIZE}
        fill="none"
        aria-hidden="true"
        className="fade-in"
      >
        <circle
          cx="100"
          cy="100"
          r="78"
          stroke="#ffffff"
          strokeOpacity="0.07"
          strokeWidth="1"
          strokeDasharray="2 9"
        />
        <circle cx="100" cy="100" r="58" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
        <g stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
          {conceptId === "geo-pythagoras" ? <PythagorasMark /> : null}
          {conceptId === "geo-angles" ? <AnglesMark /> : null}
          {conceptId === "geo-area" ? <AreaMark /> : null}
          {conceptId === "geo-perimeter" ? <PerimeterMark /> : null}
          {conceptId === "geo-triangles" ? <TrianglesMark /> : null}
        </g>
      </svg>
    </div>
  );
}

function PythagorasMark() {
  const a = 70;
  const b = 95;
  const origin = { x: 55, y: 130 };
  const top = { x: 55, y: 130 - a };
  const right = { x: 55 + b, y: 130 };
  return (
    <g>
      <polygon
        points={`${origin.x},${origin.y} ${top.x},${top.y} ${right.x},${right.y}`}
        strokeOpacity="0.85"
        strokeWidth="1.2"
        strokeDasharray="0"
      />
      <rect
        x={origin.x - a}
        y={origin.y - a}
        width={a}
        height={a}
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      <rect
        x={origin.x}
        y={origin.y}
        width={b}
        height={b * 0.62}
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      <path
        d={`M ${top.x} ${top.y} L ${top.x - 34} ${top.y - 26} L ${right.x - 34} ${right.y - 26} L ${right.x} ${right.y}`}
        strokeOpacity="0.22"
        strokeWidth="1"
        strokeDasharray="4 5"
      />
    </g>
  );
}

function AnglesMark() {
  const center = { x: 60, y: 130 };
  const radius = 78;
  const end = {
    x: center.x + Math.cos((-38 * Math.PI) / 180) * radius,
    y: center.y + Math.sin((-38 * Math.PI) / 180) * radius,
  };
  return (
    <g>
      <line x1={center.x} y1={center.y} x2={center.x + radius} y2={center.y} strokeOpacity="0.5" />
      <line x1={center.x} y1={center.y} x2={end.x} y2={end.y} strokeOpacity="0.85" strokeWidth="1.2" />
      <path
        d={`M ${center.x + 46} ${center.y} A 46 46 0 0 0 ${center.x + Math.cos((-38 * Math.PI) / 180) * 46} ${
          center.y + Math.sin((-38 * Math.PI) / 180) * 46
        }`}
        strokeOpacity="0.7"
      />
      <circle cx={center.x} cy={center.y} r="2.4" fill="#ffffff" fillOpacity="0.8" stroke="none" />
    </g>
  );
}

function AreaMark() {
  const x = 42;
  const y = 62;
  const w = 118;
  const h = 76;
  const cells = 4;
  return (
    <g>
      {Array.from({ length: cells + 1 }).map((_, index) => (
        <line
          key={`v${index}`}
          x1={x + (w / cells) * index}
          y1={y}
          x2={x + (w / cells) * index}
          y2={y + h}
          strokeOpacity="0.16"
        />
      ))}
      {Array.from({ length: 3 }).map((_, index) => (
        <line
          key={`h${index}`}
          x1={x}
          y1={y + (h / 3) * index}
          x2={x + w}
          y2={y + (h / 3) * index}
          strokeOpacity="0.16"
        />
      ))}
      <rect x={x} y={y} width={w} height={h} strokeOpacity="0.85" strokeWidth="1.2" />
    </g>
  );
}

function PerimeterMark() {
  const points = [
    { x: 46, y: 96 },
    { x: 84, y: 58 },
    { x: 136, y: 66 },
    { x: 156, y: 112 },
    { x: 104, y: 144 },
  ];
  const d =
    points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z";
  return (
    <g>
      <path d={d} strokeOpacity="0.85" strokeWidth="1.3" />
      <path d={d} strokeOpacity="0.08" strokeWidth="7" />
      {points.map((point) => (
        <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="2" fill="#ffffff" fillOpacity="0.7" stroke="none" />
      ))}
    </g>
  );
}

function TrianglesMark() {
  const points = [
    { x: 52, y: 138 },
    { x: 150, y: 130 },
    { x: 92, y: 56 },
  ];
  const arc = (vertex: number, radius: number) => {
    const a = points[(vertex + 1) % 3];
    const b = points[(vertex + 2) % 3];
    const p = points[vertex];
    const u1 = Math.atan2(a.y - p.y, a.x - p.x);
    const u2 = Math.atan2(b.y - p.y, b.x - p.x);
    const start = { x: p.x + Math.cos(u1) * radius, y: p.y + Math.sin(u1) * radius };
    const end = { x: p.x + Math.cos(u2) * radius, y: p.y + Math.sin(u2) * radius };
    const delta = Math.abs(u2 - u1);
    const large = delta > Math.PI ? 1 : 0;
    const sweep = u2 > u1 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} ${sweep} ${end.x} ${end.y}`;
  };
  return (
    <g>
      <polygon
        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeOpacity="0.85"
        strokeWidth="1.2"
      />
      {points.map((_, index) => (
        <path key={index} d={arc(index, 22)} strokeOpacity="0.45" />
      ))}
      {points.map((point) => (
        <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="2.2" fill="#ffffff" fillOpacity="0.75" stroke="none" />
      ))}
    </g>
  );
}
