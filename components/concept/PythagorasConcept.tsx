"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CONCEPTS } from "@/content/concepts";
import { formatNumber, isInteger, round } from "@/lib/format";
import {
  boundingBox,
  pythagoreanHypotenuse,
  squareOnSegment,
  type Point,
} from "@/lib/geometry";
import {
  DimensionLabel,
  RightAngleMarker,
  Segment,
  UnitGrid,
} from "@/components/geometry/primitives";
import { ConceptShell, HintPanel, LivePanel } from "./ConceptShell";
import { ChoiceTabs, ControlBar, ControlGroup, EquationDisplay, ValueRows, ValueSlider } from "./controls";

const META = CONCEPTS["geo-pythagoras"];
const MIN_LEG = 1.5;
const MAX_LEG = 12;

const EXAMPLES = [
  { id: "3-4-5", a: 3, b: 4, label: "3 · 4 · 5" },
  { id: "6-8-10", a: 6, b: 8, label: "6 · 8 · 10" },
  { id: "5-12-13", a: 5, b: 12, label: "5 · 12 · 13" },
  { id: "9-12-15", a: 9, b: 12, label: "9 · 12 · 15" },
];

export function PythagorasConcept({ onLeave }: { onLeave: () => void }) {
  const [journey, setJourney] = useState(0);
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);

  const c = pythagoreanHypotenuse(a, b);

  const roundTo = (value: number) => Math.round(value * 10) / 10;
  const handleA = (value: number) =>
    setA(roundTo(Math.max(MIN_LEG, Math.min(MAX_LEG, value))));
  const handleB = (value: number) =>
    setB(roundTo(Math.max(MIN_LEG, Math.min(MAX_LEG, value))));

  const presetId = EXAMPLES.find((example) => example.a === a && example.b === b)?.id ?? "";

  const rows = [
    { left: "a²", middle: `${formatNumber(a)}²`, right: formatNumber(round(a * a, 4)) },
    { left: "b²", middle: `${formatNumber(b)}²`, right: formatNumber(round(b * b, 4)) },
    {
      left: "a² + b²",
      middle: `${formatNumber(round(a * a, 4))} + ${formatNumber(round(b * b, 4))}`,
      right: formatNumber(round(a * a + b * b, 4)),
      emphasis: true,
    },
    {
      left: "c²",
      middle: `${formatNumber(round(c, 2))}²`,
      right: formatNumber(round(c * c, 4)),
      emphasis: true,
    },
  ];

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
          main="a² + b² = c²"
          live={`${formatNumber(round(a * a, 4))} + ${formatNumber(round(b * b, 4))} = ${formatNumber(
            round(c * c, 4),
          )}`}
        />
      }
      toolbar={
        <ControlBar>
          <ControlGroup label="AJUSTE OS LADOS" wide>
            <div className="flex flex-col gap-3">
              <ValueSlider
                symbol="a"
                value={a}
                min={MIN_LEG}
                max={MAX_LEG}
                onChange={handleA}
                display={formatNumber(a)}
              />
              <ValueSlider
                symbol="b"
                value={b}
                min={MIN_LEG}
                max={MAX_LEG}
                onChange={handleB}
                display={formatNumber(b)}
              />
            </div>
          </ControlGroup>

          <ChoiceTabs
            label="OU ESCOLHA UM TERNO PITAGÓRICO"
            options={EXAMPLES.map((example) => ({ id: example.id, label: example.label }))}
            value={presetId}
            onChange={(id) => {
              const example = EXAMPLES.find((entry) => entry.id === id);
              if (!example) return;
              setA(example.a);
              setB(example.b);
            }}
          />
        </ControlBar>
      }
      controls={
        <>
          <LivePanel title="A RELAÇÃO, AGORA">
            <ValueRows rows={rows} />
            <p className="mt-3 text-[11px] leading-relaxed text-white/40">
              {isInteger(c)
                ? `Terno pitagórico exato: (${formatNumber(a)}, ${formatNumber(b)}, ${formatNumber(c)}).`
                : `A hipotenusa vale √${formatNumber(round(a * a + b * b, 4))} ≈ ${formatNumber(c, 3)}.`}{" "}
              A igualdade nunca deixa de valer.
            </p>
          </LivePanel>

          <span className="block h-px w-full bg-white/12" />

          <HintPanel title={META.hintTitle} text={META.hint} />
        </>
      }
      footer={
        <button type="button" onClick={() => setJourney(2)} className="btn w-full justify-between">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-[9px]">
            ▷
          </span>
          VER EXEMPLOS
          <span aria-hidden="true">→</span>
        </button>
      }
    >
      {journey === 0 ? (
        <ExploreScene a={a} b={b} />
      ) : journey === 1 ? (
        <ProofScene a={a} b={b} />
      ) : journey === 2 ? (
        <ExamplesScene
          a={a}
          b={b}
          setA={handleA}
          setB={handleB}
          onExplore={() => setJourney(0)}
        />
      ) : (
        <ApplicationsScene />
      )}
    </ConceptShell>
  );
}

/* ------------------------------------------------------------- explore */

function ExploreScene({ a, b }: { a: number; b: number }) {
  const [spanLock, setSpanLock] = useState(14);
  const c = pythagoreanHypotenuse(a, b);

  const geometry = useMemo(() => {
    const V: Point = { x: 0, y: 0 };
    const A: Point = { x: 0, y: -a };
    const B: Point = { x: b, y: 0 };
    const squareA = squareOnSegment(V, A, 1);
    const squareB = squareOnSegment(V, B, -1);
    const squareC = squareOnSegment(A, B, 1);
    const box = boundingBox([...squareA, ...squareB, ...squareC]);
    const span = Math.max(box.maxX - box.minX, box.maxY - box.minY, 9.5);
    return { V, A, B, squareA, squareB, squareC, box, span };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b]);

  useEffect(() => {
    setSpanLock((current) => {
      if (geometry.span > current * 1.08 || geometry.span < current * 0.6) return geometry.span;
      return current;
    });
  }, [geometry.span]);

  const span = Math.max(geometry.span, spanLock);
  const cx = (geometry.box.minX + geometry.box.maxX) / 2;
  const cy = (geometry.box.minY + geometry.box.maxY) / 2;
  const half = span / 2 + span * 0.08;
  const viewBox = `${cx - half} ${cy - half} ${half * 2} ${half * 2}`;
  const unit = span / 22;

  const midpointC: Point = {
    x: (geometry.A.x + geometry.B.x) / 2,
    y: (geometry.A.y + geometry.B.y) / 2,
  };
  const inward = { x: -a / c, y: b / c };

  const toPoints = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={viewBox}
        className="atlas-surface h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Triângulo retângulo com catetos ${a} e ${b} e hipotenusa ${round(c, 2)}`}
      >
        <g id="decoration" opacity="0.05">
          <circle
            cx={cx}
            cy={cy}
            r={span * 0.62}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            strokeDasharray="2 10"
            vectorEffect="non-scaling-stroke"
          />
        </g>
        <defs>
          <clipPath id="pyt-square-a">
            <polygon points={toPoints(geometry.squareA)} />
          </clipPath>
          <clipPath id="pyt-square-b">
            <polygon points={toPoints(geometry.squareB)} />
          </clipPath>
          <clipPath id="pyt-square-c">
            <polygon points={toPoints(geometry.squareC)} />
          </clipPath>
        </defs>

        <polygon
          points={toPoints(geometry.squareA)}
          fill="#ffffff"
          fillOpacity="0.035"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
        <UnitGrid
          origin={geometry.V}
          u={{ x: 0, y: -1 }}
          v={{ x: -1, y: 0 }}
          columns={Math.round(a)}
          rows={Math.round(a)}
          clipPathId="pyt-square-a"
        />

        <polygon
          points={toPoints(geometry.squareB)}
          fill="#ffffff"
          fillOpacity="0.035"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
        <UnitGrid
          origin={geometry.V}
          u={{ x: 1, y: 0 }}
          v={{ x: 0, y: 1 }}
          columns={Math.round(b)}
          rows={Math.round(b)}
          clipPathId="pyt-square-b"
        />

        <polygon
          points={toPoints(geometry.squareC)}
          fill="#ffffff"
          fillOpacity="0.05"
          stroke="#ffffff"
          strokeOpacity="0.85"
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
        />
        {isInteger(c) ? (
          <UnitGrid
            origin={geometry.A}
            u={{ x: (geometry.B.x - geometry.A.x) / c, y: (geometry.B.y - geometry.A.y) / c }}
            v={{ x: a / c, y: -b / c }}
            columns={Math.round(c)}
            rows={Math.round(c)}
            clipPathId="pyt-square-c"
          />
        ) : null}

        <polygon
          points={toPoints([geometry.V, geometry.A, geometry.B])}
          fill="#ffffff"
          fillOpacity="0.08"
          stroke="#ffffff"
          strokeOpacity="0.9"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />

        <RightAngleMarker
          vertex={geometry.V}
          armA={geometry.A}
          armB={geometry.B}
          size={unit * 0.8}
        />

        <text
          x={geometry.squareA.reduce((sum, p) => sum + p.x, 0) / 4}
          y={geometry.squareA.reduce((sum, p) => sum + p.y, 0) / 4}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fillOpacity="0.9"
          fontSize={span * 0.05}
          fontStyle="italic"
        >
          a²
        </text>
        <text
          x={geometry.squareB.reduce((sum, p) => sum + p.x, 0) / 4}
          y={geometry.squareB.reduce((sum, p) => sum + p.y, 0) / 4}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fillOpacity="0.9"
          fontSize={span * 0.05}
          fontStyle="italic"
        >
          b²
        </text>
        <text
          x={geometry.squareC.reduce((sum, p) => sum + p.x, 0) / 4}
          y={geometry.squareC.reduce((sum, p) => sum + p.y, 0) / 4}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fontSize={span * 0.055}
          fontStyle="italic"
        >
          c²
        </text>

        <DimensionLabel
          a={{ x: 0, y: -a }}
          b={{ x: -a, y: -a }}
          text={formatNumber(a)}
          offset={span * 0.045}
          fontSize={span * 0.038}
          opacity={0.8}
        />
        <DimensionLabel
          a={{ x: b, y: 0 }}
          b={{ x: b, y: b }}
          text={formatNumber(b)}
          offset={span * 0.04}
          fontSize={span * 0.038}
          opacity={0.8}
        />
        <text
          x={midpointC.x + inward.x * span * 0.075}
          y={midpointC.y + inward.y * span * 0.075}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fillOpacity="0.75"
          fontSize={span * 0.038}
        >
          {formatNumber(round(c, 2))}
        </text>

        <g id="geometry-world">
          <Segment a={geometry.V} b={geometry.A} opacity={0.95} width={1.3} />
          <Segment a={geometry.V} b={geometry.B} opacity={0.95} width={1.3} />
          <Segment a={geometry.A} b={geometry.B} opacity={1} width={1.5} />
        </g>
        <circle cx={geometry.V.x} cy={geometry.V.y} r={unit * 0.5} fill="#ffffff" />
      </svg>

      <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.28em] text-white/30">
        AJUSTE OS VALORES DE A E B NOS CONTROLES ACIMA
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- proof */

function ProofScene({ a, b }: { a: number; b: number }) {
  const [progress, setProgress] = useState(0);
  const s = a + b;

  const configA: Point[][] = [
    [
      { x: 0, y: 0 },
      { x: a, y: 0 },
      { x: 0, y: b },
    ],
    [
      { x: s, y: 0 },
      { x: s, y: a },
      { x: s - b, y: 0 },
    ],
    [
      { x: s, y: s },
      { x: s - a, y: s },
      { x: s, y: s - b },
    ],
    [
      { x: 0, y: s },
      { x: 0, y: s - a },
      { x: b, y: s },
    ],
  ];

  const configB: Point[][] = [
    [
      { x: 0, y: a },
      { x: a, y: a },
      { x: a, y: s },
    ],
    [
      { x: a, y: 0 },
      { x: a, y: a },
      { x: s, y: a },
    ],
    [
      { x: a, y: 0 },
      { x: s, y: a },
      { x: s, y: 0 },
    ],
    [
      { x: 0, y: a },
      { x: a, y: s },
      { x: 0, y: s },
    ],
  ];

  const innerA: Point[] = [
    { x: a, y: 0 },
    { x: s, y: a },
    { x: b, y: s },
    { x: 0, y: b },
  ];

  const lerp = (from: Point, to: Point, t: number): Point => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  });

  const placeholderRef = useRef<SVGSVGElement | null>(null);
  const viewBox = `${-s * 0.1} ${-s * 0.1} ${s * 1.2} ${s * 1.2}`;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-3 pb-4">
        <button
          type="button"
          onClick={() => setProgress(0)}
          className={`btn h-9 min-h-0 px-4 ${progress < 0.02 ? "btn-solid" : ""}`}
        >
          c²
        </button>
        <button
          type="button"
          onClick={() => setProgress(1)}
          className={`btn h-9 min-h-0 px-4 ${progress > 0.98 ? "btn-solid" : ""}`}
        >
          a² + b²
        </button>
        <input
          type="range"
          className="atlas-range flex-1"
          min={0}
          max={1}
          step={0.005}
          value={progress}
          aria-label="Transformar a demonstração"
          onChange={(event) => setProgress(Number(event.target.value))}
        />
      </div>

      <svg
        ref={placeholderRef}
        viewBox={viewBox}
        className="min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Demonstração visual do teorema de Pitágoras"
      >
        <rect
          x={0}
          y={0}
          width={s}
          height={s}
          fill="#ffffff"
          fillOpacity="0.03"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />

        {configA.map((triangle, index) => {
          const target = configB[index];
          const points = triangle.map((point, vertex) => lerp(point, target[vertex], progress));
          return (
            <polygon
              key={index}
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="#ffffff"
              fillOpacity="0.14"
              stroke="#ffffff"
              strokeOpacity="0.75"
              strokeWidth="1.1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {progress < 0.5 ? (
          <g opacity={Math.max(0, 1 - progress * 2)}>
            <polygon
              points={innerA.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="#ffffff"
              fillOpacity="0.07"
              stroke="#ffffff"
              strokeOpacity="0.7"
              strokeDasharray="5 5"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={s / 2}
              y={s / 2}
              textAnchor="middle"
              dy="0.34em"
              fill="#ffffff"
              fontSize={s * 0.07}
              fontStyle="italic"
            >
              c²
            </text>
          </g>
        ) : (
          <g opacity={Math.max(0, (progress - 0.5) * 2)}>
            <rect
              x={0}
              y={0}
              width={a}
              height={a}
              fill="#ffffff"
              fillOpacity="0.07"
              stroke="#ffffff"
              strokeOpacity="0.75"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={a}
              y={a}
              width={b}
              height={b}
              fill="#ffffff"
              fillOpacity="0.1"
              stroke="#ffffff"
              strokeOpacity="0.8"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={a / 2}
              y={a / 2}
              textAnchor="middle"
              dy="0.34em"
              fill="#ffffff"
              fontSize={s * 0.062}
              fontStyle="italic"
            >
              a²
            </text>
            <text
              x={a + b / 2}
              y={a + b / 2}
              textAnchor="middle"
              dy="0.34em"
              fill="#ffffff"
              fontSize={s * 0.062}
              fontStyle="italic"
            >
              b²
            </text>
          </g>
        )}
      </svg>

      <p className="pt-3 text-center text-[11.5px] leading-relaxed text-white/45">
        As quatro cópias do triângulo ocupam sempre a mesma área. O que sobra no quadrado maior
        é uma vez c² e, na outra arrumação, a² + b². Logo, c² = a² + b².
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ examples */

function ExamplesScene({
  a,
  b,
  setA,
  setB,
  onExplore,
}: {
  a: number;
  b: number;
  setA: (value: number) => void;
  setB: (value: number) => void;
  onExplore: () => void;
}) {
  const example = { a, b, label: `Catetos ${formatNumber(a)} e ${formatNumber(b)}` };
  const c = pythagoreanHypotenuse(example.a, example.b);
  const index = Math.max(
    0,
    EXAMPLES.findIndex((entry) => entry.a === a && entry.b === b),
  );
  const step = (delta: number) => {
    const next = EXAMPLES[(index + delta + EXAMPLES.length) % EXAMPLES.length];
    setA(next.a);
    setB(next.b);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox="-1.5 -1.5 20 16"
        className="min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Exemplo ${example.label}`}
      >
        <polygon
          points={`0,12 ${example.a},12 ${example.a},${12 - example.b}`}
          fill="#ffffff"
          fillOpacity="0.06"
          stroke="#ffffff"
          strokeOpacity="0.85"
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
        />
        <RightAngleMarker
          vertex={{ x: example.a, y: 12 }}
          armA={{ x: 0, y: 12 }}
          armB={{ x: example.a, y: 12 - example.b }}
          size={1}
        />
        <DimensionLabel
          a={{ x: 0, y: 12 }}
          b={{ x: example.a, y: 12 }}
          text={String(example.a)}
          offset={0.7}
          fontSize={1.1}
        />
        <DimensionLabel
          a={{ x: example.a, y: 12 }}
          b={{ x: example.a, y: 12 - example.b }}
          text={String(example.b)}
          offset={-0.8}
          fontSize={1.1}
        />
        <DimensionLabel
          a={{ x: 0, y: 12 }}
          b={{ x: example.a, y: 12 - example.b }}
          text={`c = ${formatNumber(c)}`}
          offset={-1.1}
          fontSize={1.1}
        />
      </svg>

      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="micro">
              EXEMPLO {index + 1} DE {EXAMPLES.length}
            </p>
            <p className="font-display text-[15px] tracking-[0.1em] text-white">{example.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-[13px] text-white/70 transition-colors hover:border-white/60 hover:text-white"
              aria-label="Exemplo anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-[13px] text-white/70 transition-colors hover:border-white/60 hover:text-white"
              aria-label="Próximo exemplo"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid gap-2 font-display text-[13.5px] tracking-[0.03em] text-white/65 sm:grid-cols-2">
          <p>
            c² = {example.a}² + {example.b}²
          </p>
          <p>
            c² = {example.a * example.a} + {example.b * example.b}
          </p>
          <p>c² = {example.a * example.a + example.b * example.b}</p>
          <p className="text-white">c = {formatNumber(c)}</p>
        </div>

        <button type="button" onClick={onExplore} className="btn w-fit">
          VER NO CONCEITO →
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- applications */

const APPLICATIONS = [
  {
    title: "ESCADA APOIADA",
    text: "Uma escada de 5 m é apoiada em uma parede, com a base a 3 m dela.",
    question: "A que altura a escada toca a parede?",
    answer: "4 m",
    a: 3,
    b: 4,
  },
  {
    title: "DIAGONAL DA TELA",
    text: "Uma tela tem 40 cm de altura e 30 cm de largura.",
    question: "Qual é a medida da diagonal?",
    answer: "50 cm",
    a: 30,
    b: 40,
  },
  {
    title: "MENOR DISTÂNCIA",
    text: "Um ciclista percorre 6 km para o norte e depois 8 km para o leste.",
    question: "Qual é a distância em linha reta até o ponto de partida?",
    answer: "10 km",
    a: 6,
    b: 8,
  },
];

function ApplicationsScene() {
  const [index, setIndex] = useState(0);
  const item = APPLICATIONS[index];
  const scale = 10 / Math.max(item.a, item.b);
  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {APPLICATIONS.map((entry, position) => (
          <button
            key={entry.title}
            type="button"
            onClick={() => setIndex(position)}
            className={`min-h-[34px] rounded-full border px-4 text-[10px] tracking-[0.2em] transition-colors ${
              position === index
                ? "border-white bg-white text-black"
                : "border-white/20 text-white/55 hover:border-white/50 hover:text-white"
            }`}
          >
            {entry.title}
          </button>
        ))}
      </div>

      <svg
        viewBox="-2 -2 16 13"
        className="min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Aplicação: ${item.title}`}
      >
        <polygon
          points={`0,9 ${item.a * scale},9 ${item.a * scale},${9 - item.b * scale}`}
          fill="#ffffff"
          fillOpacity="0.06"
          stroke="#ffffff"
          strokeOpacity="0.8"
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
        />
        <RightAngleMarker
          vertex={{ x: item.a * scale, y: 9 }}
          armA={{ x: 0, y: 9 }}
          armB={{ x: item.a * scale, y: 9 - item.b * scale }}
          size={0.9}
        />
        <DimensionLabel
          a={{ x: 0, y: 9 }}
          b={{ x: item.a * scale, y: 9 }}
          text={`${item.a}`}
          offset={0.7}
          fontSize={0.9}
        />
        <DimensionLabel
          a={{ x: item.a * scale, y: 9 }}
          b={{ x: item.a * scale, y: 9 - item.b * scale }}
          text={`${item.b}`}
          offset={-0.75}
          fontSize={0.9}
        />
        <DimensionLabel
          a={{ x: 0, y: 9 }}
          b={{ x: item.a * scale, y: 9 - item.b * scale }}
          text="x"
          offset={-0.9}
          fontSize={0.95}
        />
      </svg>

      <div className="flex flex-col gap-3">
        <p className="max-w-[560px] text-[13.5px] leading-[1.7] text-white/60">{item.text}</p>
        <p className="text-[13px] text-white/85">{item.question}</p>
        <div className="flex items-center gap-5">
          <span className="tabular font-display text-[20px] text-white">{item.answer}</span>
          <span className="text-[11px] tracking-[0.2em] text-white/35">
            x² = {item.a}² + {item.b}² = {item.a * item.a + item.b * item.b}
          </span>
        </div>
      </div>
    </div>
  );
}
