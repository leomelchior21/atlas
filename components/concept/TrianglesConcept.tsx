"use client";

import { useMemo, useState } from "react";
import { CONCEPTS } from "@/content/concepts";
import { formatNumber, round } from "@/lib/format";
import {
  angleAtVertex,
  boundingBox,
  classifyTriangleSides,
  degrees,
  distance,
  triangleArea,
  type Point,
} from "@/lib/geometry";
import { beginSvgDrag, handleSliderKeys } from "@/components/geometry/useSvgDrag";
import { ConceptShell, HintPanel, LivePanel } from "./ConceptShell";
import { ChoiceTabs, EquationDisplay, StatLine } from "./controls";

const META = CONCEPTS["geo-triangles"];

const HOME: Point[] = [
  { x: 0.4, y: 5.6 },
  { x: 9.6, y: 5.2 },
  { x: 5.4, y: 0.4 },
];

export function TrianglesConcept({ onLeave }: { onLeave: () => void }) {
  const [journey, setJourney] = useState(0);
  const [points, setPoints] = useState<Point[]>(HOME);
  const [dragging, setDragging] = useState<number | null>(null);

  const sides = useMemo(
    () => [
      distance(points[1], points[2]),
      distance(points[0], points[2]),
      distance(points[0], points[1]),
    ],
    [points],
  );
  const angles = useMemo(
    () => [
      degrees(angleAtVertex(points[1], points[0], points[2])),
      degrees(angleAtVertex(points[0], points[1], points[2])),
      degrees(angleAtVertex(points[0], points[2], points[1])),
    ],
    [points],
  );

  const sum = angles[0] + angles[1] + angles[2];
  const area = triangleArea(points[0], points[1], points[2]);
  const sideClass = classifyTriangleSides(sides[0], sides[1], sides[2]);
  const angleClass =
    Math.max(...angles) > 90.6
      ? "Obtusângulo"
      : Math.abs(Math.max(...angles) - 90) <= 0.6
        ? "Retângulo"
        : "Acutângulo";

  const update = (index: number, point: Point) => {
    setPoints((current) => {
      const next = [...current];
      next[index] = {
        x: Math.max(-0.4, Math.min(10.4, point.x)),
        y: Math.max(-0.4, Math.min(6.8, point.y)),
      };
      if (triangleArea(next[0], next[1], next[2]) < 1.4) return current;
      return next;
    });
  };

  return (
    <ConceptShell
      meta={META}
      journey={journey}
      onJourney={(index) => {
        if (index < 0) {
          onLeave();
          return;
        }
        setJourney(index);
      }}
      equation={
        <EquationDisplay
          main="α + β + γ = 180°"
          live={`${formatNumber(round(angles[0], 1))}° + ${formatNumber(round(angles[1], 1))}° + ${formatNumber(
            round(angles[2], 1),
          )}° = ${formatNumber(round(sum, 1))}°`}
        />
      }
      controls={
        <>
          <LivePanel title="CLASSIFICAÇÃO">
            <div className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col gap-1.5">
                <p className="micro">PELOS LADOS</p>
                <p className="font-display text-[17px] font-light tracking-[0.02em] text-white">
                  {sideClass}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="micro">PELOS ÂNGULOS</p>
                <p className="font-display text-[17px] font-light tracking-[0.02em] text-white">
                  {angleClass}
                </p>
              </div>
            </div>
          </LivePanel>

          <span className="block h-px w-full bg-white/12" />

          <LivePanel title="MEDIDAS">
            <div className="flex flex-col pt-1">
              <StatLine label="LADO A" value={`${formatNumber(round(sides[0], 2))} cm`} />
              <StatLine label="LADO B" value={`${formatNumber(round(sides[1], 2))} cm`} />
              <StatLine label="LADO C" value={`${formatNumber(round(sides[2], 2))} cm`} />
              <StatLine label="ÂNGULOS" value={`${formatNumber(round(sum, 1))}°`} />
              <StatLine label="ÁREA" value={`${formatNumber(round(area, 2))} cm²`} />
            </div>
          </LivePanel>

          <HintPanel title="EXPERIMENTE" text={META.hint} />
        </>
      }
    >
      {journey === 0 ? (
        <TriangleScene
          points={points}
          angles={angles}
          sides={sides}
          dragging={dragging}
          setDragging={setDragging}
          onDrag={update}
          onReset={() => setPoints(HOME)}
        />
      ) : journey === 1 ? (
        <SumScene points={points} angles={angles} />
      ) : journey === 2 ? (
        <ExamplesScene />
      ) : (
        <ApplicationsScene />
      )}
    </ConceptShell>
  );
}

/* ------------------------------------------------------------- explore */

function TriangleScene({
  points,
  angles,
  sides,
  dragging,
  setDragging,
  onDrag,
  onReset,
}: {
  points: Point[];
  angles: number[];
  sides: number[];
  dragging: number | null;
  setDragging: (index: number | null) => void;
  onDrag: (index: number, point: Point) => void;
  onReset: () => void;
}) {
  const box = boundingBox(points);
  const width = Math.max(1, box.maxX - box.minX);
  const height = Math.max(1, box.maxY - box.minY);
  const span = Math.max(width, height) * 1.62;
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const viewBox = `${cx - span / 2} ${cy - span / 2} ${span} ${span}`;

  const unit = span / 100;
  const centroid = {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3,
  };

  const sideLabel = (index: number) => {
    const a = points[index];
    const b = points[(index + 1) % 3];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const away = { x: mid.x - centroid.x, y: mid.y - centroid.y };
    const length = Math.max(0.001, Math.hypot(away.x, away.y));
    const offset = unit * 6.5;
    return {
      x: mid.x + (away.x / length) * offset,
      y: mid.y + (away.y / length) * offset,
      value: sides[index],
    };
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={viewBox}
          className="atlas-surface h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Triângulo com ângulos ${angles.map((a) => a.toFixed(0)).join(", ")} graus`}
        >
          {/* decorative construction, never on top of the figure */}
          <g id="decoration" opacity="0.06">
            <circle cx={centroid.x} cy={centroid.y} r={span * 0.34} stroke="#ffffff" fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 9" />
            <circle cx={centroid.x} cy={centroid.y} r={span * 0.46} stroke="#ffffff" fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </g>

          {/* geometry */}
          <g id="geometry-world">
            <polygon
              points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="#ffffff"
              fillOpacity="0.045"
              stroke="#ffffff"
              strokeOpacity="0.9"
              strokeWidth="1.4"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((point, index) => {
              const next = points[(index + 1) % 3];
              const prev = points[(index + 2) % 3];
              const radius = Math.min(
                distance(point, next),
                distance(point, prev),
              ) * 0.24;
              return (
                <path
                  key={`arc-${index}`}
                  d={arcPath(point, next, prev, radius)}
                  fill="#ffffff"
                  fillOpacity={Math.abs(angles[index] - 90) < 0.8 ? 0.12 : 0.05}
                  stroke="#ffffff"
                  strokeOpacity="0.7"
                  strokeWidth="1.1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          {/* labels stay in figure units derived from the viewBox, never absolute */}
          <g id="screen-labels">
            {points.map((point, index) => {
              const next = points[(index + 1) % 3];
              const prev = points[(index + 2) % 3];
              const radius = Math.min(distance(point, next), distance(point, prev)) * 0.24;
              const bisector = bisectorPoint(point, next, prev, radius * 1.75);
              return (
                <text
                  key={`angle-${index}`}
                  x={bisector.x}
                  y={bisector.y}
                  textAnchor="middle"
                  dy="0.34em"
                  fill="#ffffff"
                  fillOpacity="0.9"
                  fontSize={unit * 13}
                  letterSpacing={unit * 0.2}
                >
                  {angles[index].toFixed(0)}°
                </text>
              );
            })}

            {points.map((_, index) => {
              const label = sideLabel(index);
              return (
                <text
                  key={`side-${index}`}
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dy="0.34em"
                  fill="#ffffff"
                  fillOpacity="0.62"
                  fontSize={unit * 12}
                >
                  {formatNumber(round(label.value, 2))}
                </text>
              );
            })}
          </g>

          {/* interaction */}
          <g id="interaction-handles">
            {points.map((point, index) => (
              <g
                key={`handle-${index}`}
                className="cursor-grab"
                role="slider"
                aria-label={`Vértice ${index + 1}: arraste ou use as setas`}
                aria-valuetext={`x ${point.x.toFixed(1)}, y ${point.y.toFixed(1)}`}
                tabIndex={0}
                onKeyDown={(event) =>
                  handleSliderKeys(event, {
                    onDelta: (dx, dy) =>
                      onDrag(index, { x: point.x + dx * 0.2, y: point.y + dy * 0.2 }),
                    step: 1,
                    fastStep: 5,
                  })
                }
                onPointerDown={(event) => {
                  setDragging(index);
                  beginSvgDrag(
                    event,
                    (svgPoint) => onDrag(index, svgPoint),
                    () => setDragging(null),
                  );
                }}
              >
                <circle cx={point.x} cy={point.y} r={unit * 5} fill="transparent" />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={dragging === index ? unit * 1.5 : unit * 1.1}
                  fill="#000000"
                  stroke="#ffffff"
                  strokeWidth="1.3"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={point.x} cy={point.y} r={unit * 0.4} fill="#ffffff" />
              </g>
            ))}
          </g>
        </svg>

        <button
          type="button"
          onClick={onReset}
          className="absolute bottom-1 right-1 text-[10px] tracking-[0.26em] text-white/35 transition-colors hover:text-white"
        >
          RESTAURAR
        </button>
      </div>

      <p className="pt-3 text-center text-[10px] tracking-[0.26em] text-white/30">
        ARRASTE OS VÉRTICES · A SOMA DOS ÂNGULOS NÃO MUDA
      </p>
    </div>
  );
}

function unit(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function bisectorPoint(vertex: Point, a: Point, b: Point, radius: number): Point {
  const u1 = unit(vertex, a);
  const u2 = unit(vertex, b);
  const sum = { x: u1.x + u2.x, y: u1.y + u2.y };
  const length = Math.hypot(sum.x, sum.y) || 1;
  return { x: vertex.x + (sum.x / length) * radius, y: vertex.y + (sum.y / length) * radius };
}

function arcPath(vertex: Point, a: Point, b: Point, radius: number): string {
  const u1 = unit(vertex, a);
  const u2 = unit(vertex, b);
  const start = { x: vertex.x + u1.x * radius, y: vertex.y + u1.y * radius };
  const end = { x: vertex.x + u2.x * radius, y: vertex.y + u2.y * radius };
  const cross = u1.x * u2.y - u1.y * u2.x;
  const dot = u1.x * u2.x + u1.y * u2.y;
  const sweep = cross > 0 ? 0 : 1;
  const large = dot < 0 ? 0 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} ${sweep} ${end.x} ${end.y}`;
}

/* --------------------------------------------------------------- proof */

function SumScene({ points, angles }: { points: Point[]; angles: number[] }) {
  const [progress, setProgress] = useState(0);
  const length = 3.6;
  const cumulative = [0, angles[0], angles[0] + angles[1]];

  const sources = useMemo(
    () =>
      points.map((point, index) => {
        const prev = points[(index + 2) % 3];
        const next = points[(index + 1) % 3];
        const bisector = bisectorPoint(point, next, prev, 1);
        const rotation =
          (Math.atan2(bisector.y - point.y, bisector.x - point.x) * 180) / Math.PI;
        return { rotation };
      }),
    [points],
  );

  const wedge = (angle: number) => {
    const half = ((angle / 2) * Math.PI) / 180;
    const from = { x: Math.cos(-half) * length, y: Math.sin(-half) * length };
    const to = { x: Math.cos(half) * length, y: Math.sin(half) * length };
    return `M 0 0 L ${from.x} ${from.y} A ${length} ${length} 0 0 1 ${to.x} ${to.y} Z`;
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <svg
        viewBox="-5.2 -5 10.4 11.4"
        className="min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Demonstração da soma dos ângulos internos"
      >
        <line
          x1={-length - 0.8}
          y1={0}
          x2={length + 0.8}
          y2={0}
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
        {angles.map((angle, index) => {
          const targetRotation = cumulative[index] + angle / 2;
          const rotation =
            sources[index].rotation + (targetRotation - sources[index].rotation) * progress;
          const px = points[index].x * (1 - progress) * 0.6;
          const py = points[index].y * (1 - progress) * 0.6 - 2.2 * progress;
          return (
            <g key={index} transform={`translate(${px} ${py}) rotate(${rotation})`}>
              <path
                d={wedge(angle)}
                fill="#ffffff"
                fillOpacity={0.07 + 0.1 * progress}
                stroke="#ffffff"
                strokeOpacity="0.75"
                strokeWidth="1.1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
        <text
          x={0}
          y={length + 2.6}
          textAnchor="middle"
          fill="#ffffff"
          fillOpacity={0.4 + 0.6 * progress}
          fontSize="0.72"
          letterSpacing="0.24em"
        >
          {formatNumber(round(angles[0] + angles[1] + angles[2], 1))}°
        </text>
      </svg>

      <div className="flex flex-col gap-3">
        <input
          type="range"
          className="atlas-range"
          min={0}
          max={1}
          step={0.005}
          value={progress}
          aria-label="Mover os três ângulos para a mesma reta"
          onChange={(event) => setProgress(Number(event.target.value))}
        />
        <p className="t-body text-[13.5px]">
          Recorte mentalmente os três ângulos e encaixe-os lado a lado sobre uma reta. Eles
          preenchem exatamente o ângulo raso:{" "}
          <span className="text-white/85">
            {angles.map((value) => `${value.toFixed(0)}°`).join(" + ")} = 180°
          </span>
          .
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ examples */

const EXAMPLES = [
  {
    prompt: "Dois ângulos de um triângulo medem 65° e 48°. Qual é o terceiro ângulo?",
    steps: ["α + 65° + 48° = 180°", "α = 180° − 113°", "α = 67°"],
  },
  {
    prompt: "Um triângulo isósceles tem ângulo do vértice de 40°. Quanto mede cada ângulo da base?",
    steps: ["180° − 40° = 140°", "140° ÷ 2 = 70°"],
  },
  {
    prompt: "Um triângulo tem lados 7 cm, 7 cm e 10 cm. Como ele é classificado?",
    steps: ["dois lados iguais", "isósceles"],
  },
  {
    prompt: "É possível um triângulo com lados 4 cm, 5 cm e 10 cm?",
    steps: ["4 + 5 = 9 < 10", "não é possível: a soma de dois lados deve superar o terceiro"],
  },
];

function ExamplesScene() {
  const [index, setIndex] = useState(0);
  const example = EXAMPLES[index];
  return (
    <div className="flex h-full w-full flex-col items-start justify-center gap-6">
      <p className="micro">
        EXEMPLO {index + 1} DE {EXAMPLES.length}
      </p>
      <p className="font-display text-[22px] font-light leading-[1.45] tracking-[-0.004em] text-white">
        {example.prompt}
      </p>
      <div className="flex flex-col gap-2">
        {example.steps.map((step) => (
          <p key={step} className="tabular font-display text-[15px] tracking-[0.01em] text-white/65">
            {step}
          </p>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIndex((index - 1 + EXAMPLES.length) % EXAMPLES.length)}
          className="btn"
        >
          ← ANTERIOR
        </button>
        <button
          type="button"
          onClick={() => setIndex((index + 1) % EXAMPLES.length)}
          className="btn"
        >
          PRÓXIMO →
        </button>
      </div>
    </div>
  );
}

const APPLICATIONS = [
  {
    title: "ESTRUTURA",
    text: "Em uma treliça, dois ângulos medem 55° e 72°. Qual é o terceiro ângulo da peça triangular?",
    answer: "53°",
    detail: "180° − (55° + 72°) = 53°",
  },
  {
    title: "SINALIZAÇÃO",
    text: "Uma placa triangular tem os três lados iguais. Como ela é classificada?",
    answer: "Equilátero",
    detail: "três lados congruentes → três ângulos de 60°",
  },
  {
    title: "TELHADO",
    text: "Um telhado tem ângulo do vértice de 100° e dois lados iguais. Quanto mede cada ângulo da base?",
    answer: "40°",
    detail: "(180° − 100°) ÷ 2 = 40°",
  },
];

function ApplicationsScene() {
  const [index, setIndex] = useState(0);
  const item = APPLICATIONS[index];
  return (
    <div className="flex h-full w-full flex-col justify-center gap-6">
      <ChoiceTabs
        options={APPLICATIONS.map((entry, position) => ({
          id: String(position),
          label: entry.title,
        }))}
        value={String(index)}
        onChange={(id) => setIndex(Number(id))}
      />
      <p className="t-body max-w-[560px]">{item.text}</p>
      <div className="flex flex-col gap-2">
        <p className="tabular font-display text-[24px] text-white">{item.answer}</p>
        <p className="tabular text-[12.5px] tracking-[0.04em] text-white/45">{item.detail}</p>
      </div>
    </div>
  );
}
