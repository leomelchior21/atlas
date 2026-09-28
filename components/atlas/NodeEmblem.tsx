"use client";

import type { ReactNode } from "react";

/**
 * The wireframe drawing that accompanies a territory or concept. Decorative
 * only: thin strokes, low opacity, never competing with the interface.
 */
export function NodeEmblem({ id, className = "h-44 w-44" }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="#ffffff"
      strokeWidth="0.9"
      aria-hidden="true"
    >
      {markFor(id)}
    </svg>
  );
}

function markFor(id: string): ReactNode {
  if (id === "math-root" || id.startsWith("math-") || id.startsWith("num-") || id.startsWith("alg-") || id.startsWith("func-") || id.startsWith("sta-") || id.startsWith("fin-") || id.startsWith("trig-") || id.startsWith("med-")) {
    if (id.startsWith("trig-") || id === "math-trig") return <WaveMark />;
    if (id.startsWith("sta-") || id === "math-stats") return <BarsMark />;
    if (id.startsWith("func-") || id === "math-functions") return <CurveMark />;
    return <GlobeMark />;
  }
  if (id === "physics-root" || id.startsWith("phy-")) return <AtomMark />;
  if (id === "chemistry-root" || id.startsWith("chem-")) return <MoleculeMark />;
  if (id === "geo-pythagoras") return <PythagorasMark />;
  if (id === "geo-angles") return <AnglesMark />;
  if (id === "geo-area") return <AreaMark />;
  if (id === "geo-perimeter") return <PerimeterMark />;
  if (id === "geo" || id.startsWith("geo-")) return <TriangleCircleMark />;
  return <OrbitMark />;
}

function PythagorasMark() {
  const a = 62;
  const b = 84;
  const origin = { x: 48, y: 136 };
  const top = { x: 48, y: 136 - a };
  const right = { x: 48 + b, y: 136 };
  return (
    <g strokeOpacity="0.55">
      <polygon
        points={`${origin.x},${origin.y} ${top.x},${top.y} ${right.x},${right.y}`}
        strokeOpacity="0.75"
      />
      <rect x={origin.x - a} y={origin.y - a} width={a} height={a} strokeOpacity="0.3" />
      <rect x={origin.x} y={origin.y} width={b} height={b * 0.6} strokeOpacity="0.3" />
      <path
        d={`M ${top.x} ${top.y} L ${top.x - 30} ${top.y - 22} L ${right.x - 30} ${right.y - 22} L ${right.x} ${right.y}`}
        strokeOpacity="0.22"
        strokeDasharray="4 5"
      />
      <circle cx={origin.x} cy={origin.y} r="2.6" fill="#ffffff" fillOpacity="0.75" stroke="none" />
    </g>
  );
}

function AnglesMark() {
  const center = { x: 56, y: 132 };
  const radius = 72;
  const angle = (-40 * Math.PI) / 180;
  return (
    <g strokeOpacity="0.55">
      <line x1={center.x} y1={center.y} x2={center.x + radius} y2={center.y} strokeOpacity="0.5" />
      <line
        x1={center.x}
        y1={center.y}
        x2={center.x + Math.cos(angle) * radius}
        y2={center.y + Math.sin(angle) * radius}
        strokeOpacity="0.75"
      />
      <path
        d={`M ${center.x + 44} ${center.y} A 44 44 0 0 0 ${
          center.x + Math.cos(angle) * 44
        } ${center.y + Math.sin(angle) * 44}`}
        strokeOpacity="0.6"
      />
      <circle cx={center.x} cy={center.y} r="2.6" fill="#ffffff" fillOpacity="0.75" stroke="none" />
    </g>
  );
}

function AreaMark() {
  const x = 42;
  const y = 62;
  const w = 116;
  const h = 76;
  const cells = 4;
  return (
    <g strokeOpacity="0.5">
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
      <rect x={x} y={y} width={w} height={h} strokeOpacity="0.75" />
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
    <g strokeOpacity="0.55">
      <path d={d} strokeOpacity="0.75" />
      {points.map((point) => (
        <circle
          key={`${point.x}-${point.y}`}
          cx={point.x}
          cy={point.y}
          r="2.2"
          fill="#ffffff"
          fillOpacity="0.7"
          stroke="none"
        />
      ))}
    </g>
  );
}

function TriangleCircleMark() {
  return (
    <g strokeOpacity="0.55">
      <circle cx="100" cy="100" r="72" strokeOpacity="0.18" strokeDasharray="2 8" />
      <circle cx="100" cy="100" r="54" strokeOpacity="0.14" />
      <polygon points="100,36 158,146 42,146" strokeOpacity="0.7" />
      <line x1="100" y1="36" x2="100" y2="146" strokeOpacity="0.22" strokeDasharray="3 5" />
      <line x1="42" y1="146" x2="129" y2="91" strokeOpacity="0.22" strokeDasharray="3 5" />
      <line x1="158" y1="146" x2="71" y2="91" strokeOpacity="0.22" strokeDasharray="3 5" />
      <circle cx="100" cy="100" r="3" fill="#ffffff" fillOpacity="0.7" stroke="none" />
      {[
        [100, 36],
        [158, 146],
        [42, 146],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#ffffff" fillOpacity="0.75" stroke="none" />
      ))}
    </g>
  );
}

function GlobeMark() {
  return (
    <g strokeOpacity="0.5">
      <circle cx="100" cy="100" r="66" strokeOpacity="0.6" />
      <ellipse cx="100" cy="100" rx="66" ry="24" strokeOpacity="0.3" />
      <ellipse cx="100" cy="100" rx="66" ry="46" strokeOpacity="0.18" />
      <ellipse cx="100" cy="100" rx="26" ry="66" strokeOpacity="0.3" />
      <ellipse cx="100" cy="100" rx="52" ry="66" strokeOpacity="0.16" />
      <line x1="34" y1="100" x2="166" y2="100" strokeOpacity="0.16" />
      <circle cx="152" cy="72" r="2.6" fill="#ffffff" fillOpacity="0.8" stroke="none" className="breathe" />
    </g>
  );
}

function AtomMark() {
  return (
    <g strokeOpacity="0.5">
      <circle cx="100" cy="100" r="10" strokeOpacity="0.7" />
      <circle cx="100" cy="100" r="4" fill="#ffffff" fillOpacity="0.8" stroke="none" />
      <g className="orbit-slow">
        <ellipse cx="100" cy="100" rx="76" ry="28" strokeOpacity="0.35" />
        <circle cx="176" cy="100" r="2.6" fill="#ffffff" fillOpacity="0.8" stroke="none" />
      </g>
      <ellipse cx="100" cy="100" rx="76" ry="28" transform="rotate(60 100 100)" strokeOpacity="0.3" />
      <ellipse cx="100" cy="100" rx="76" ry="28" transform="rotate(120 100 100)" strokeOpacity="0.3" />
    </g>
  );
}

function MoleculeMark() {
  return (
    <g strokeOpacity="0.5">
      <polygon points="100,44 148,72 148,128 100,156 52,128 52,72" strokeOpacity="0.6" />
      <line x1="100" y1="44" x2="100" y2="100" strokeOpacity="0.25" strokeDasharray="3 5" />
      <line x1="148" y1="128" x2="100" y2="100" strokeOpacity="0.25" strokeDasharray="3 5" />
      <line x1="52" y1="128" x2="100" y2="100" strokeOpacity="0.25" strokeDasharray="3 5" />
      {[
        [100, 44],
        [148, 72],
        [148, 128],
        [100, 156],
        [52, 128],
        [52, 72],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#ffffff" fillOpacity="0.7" stroke="none" />
      ))}
    </g>
  );
}

function CurveMark() {
  return (
    <g strokeOpacity="0.5">
      <line x1="30" y1="100" x2="170" y2="100" strokeOpacity="0.2" />
      <line x1="100" y1="30" x2="100" y2="170" strokeOpacity="0.2" />
      <path d="M40 150C70 150 74 50 100 50s30 100 60 100" strokeOpacity="0.7" />
      <circle cx="100" cy="50" r="2.6" fill="#ffffff" fillOpacity="0.8" stroke="none" />
    </g>
  );
}

function BarsMark() {
  return (
    <g strokeOpacity="0.5">
      <line x1="38" y1="156" x2="162" y2="156" strokeOpacity="0.25" />
      <rect x="52" y="108" width="18" height="48" />
      <rect x="88" y="72" width="18" height="84" />
      <rect x="124" y="92" width="18" height="64" />
    </g>
  );
}

function WaveMark() {
  return (
    <g strokeOpacity="0.5">
      <line x1="26" y1="100" x2="174" y2="100" strokeOpacity="0.2" />
      <path d="M26 100c12 0 12-44 24-44s12 44 24 44 12-44 24-44 12 44 24 44 12-44 24-44 12 44 24 44" strokeOpacity="0.65" />
      <circle cx="146" cy="56" r="2.6" fill="#ffffff" fillOpacity="0.8" stroke="none" />
    </g>
  );
}

function OrbitMark() {
  return (
    <g strokeOpacity="0.5">
      <circle cx="100" cy="100" r="58" strokeOpacity="0.45" strokeDasharray="2 9" />
      <circle cx="100" cy="100" r="34" strokeOpacity="0.2" />
      <circle cx="100" cy="100" r="4" fill="#ffffff" fillOpacity="0.8" stroke="none" />
      <circle cx="158" cy="100" r="2.6" fill="#ffffff" fillOpacity="0.6" stroke="none" />
    </g>
  );
}
