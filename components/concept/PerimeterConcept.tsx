"use client";

import { useMemo, useState } from "react";
import { CONCEPTS } from "@/content/concepts";
import { formatNumber, round } from "@/lib/format";
import {
  distance,
  polygonArea,
  polygonPerimeter,
  type Point,
} from "@/lib/geometry";
import { DimensionLabel } from "@/components/geometry/primitives";
import { ConceptShell, HintPanel, LivePanel } from "./ConceptShell";
import { ChoiceTabs, ControlBar, ControlGroup, EquationDisplay, StatLine, ValueSlider } from "./controls";

const META = CONCEPTS["geo-perimeter"];

const MIN_SIDE = 2;
const MAX_SIDE = 10;

const VARIANTS = [
  { id: "retangulo", label: "RETÂNGULO" },
  { id: "irregular", label: "IRREGULAR" },
  { id: "triangulo", label: "TRIÂNGULO" },
] as const;

type VariantId = (typeof VARIANTS)[number]["id"];

/** every figure is built from the same two controls: b and h */
function shapePoints(variant: VariantId, b: number, h: number): Point[] {
  if (variant === "irregular") {
    return [
      { x: b * 0.05, y: h * 0.26 },
      { x: b * 0.58, y: 0 },
      { x: b, y: h * 0.48 },
      { x: b * 0.65, y: h },
      { x: b * 0.15, y: h * 0.85 },
    ];
  }
  if (variant === "triangulo") {
    return [
      { x: 0, y: 0 },
      { x: b, y: h * 0.24 },
      { x: b * 0.38, y: h },
    ];
  }
  return [
    { x: 0, y: 0 },
    { x: b, y: 0 },
    { x: b, y: h },
    { x: 0, y: h },
  ];
}

export function PerimeterConcept({ onLeave }: { onLeave: () => void }) {
  const [journey, setJourney] = useState(0);
  const [variant, setVariant] = useState<VariantId>("retangulo");
  const [base, setBase] = useState(8);
  const [height, setHeight] = useState(4.6);

  const points = useMemo(() => shapePoints(variant, base, height), [variant, base, height]);

  const perimeter = polygonPerimeter(points);
  const area = polygonArea(points);

  return (
    <ConceptShell
      meta={META}
      journey={journey}
      onJourney={(index) => (index < 0 ? onLeave() : setJourney(index))}
      toolbar={
        <ControlBar>
          <ControlGroup label="FIGURA">
            <ChoiceTabs
              options={VARIANTS.map((item) => ({ id: item.id, label: item.label }))}
              value={variant}
              onChange={setVariant}
            />
          </ControlGroup>

          <ControlGroup label="AJUSTE O TAMANHO" wide>
            <div className="flex flex-col gap-3">
              <ValueSlider
                symbol="b"
                value={base}
                min={MIN_SIDE}
                max={MAX_SIDE}
                step={0.2}
                onChange={(value) => setBase(Math.round(value * 10) / 10)}
                display={`${formatNumber(base)} cm`}
              />
              <ValueSlider
                symbol="h"
                value={height}
                min={MIN_SIDE}
                max={MAX_SIDE}
                step={0.2}
                onChange={(value) => setHeight(Math.round(value * 10) / 10)}
                display={`${formatNumber(height)} cm`}
              />
            </div>
          </ControlGroup>
        </ControlBar>
      }
      equation={
        <EquationDisplay
          main="P = soma dos lados"
          live={`P = ${formatNumber(round(perimeter, 2))} cm`}
        />
      }
      controls={
        <>
          <LivePanel title="LADOS">
            <div className="flex flex-col pt-1">
              {points.map((point, index) => {
                const next = points[(index + 1) % points.length];
                return (
                  <StatLine
                    key={`${variant}-${index}`}
                    label={`LADO ${index + 1}`}
                    value={`${formatNumber(round(distance(point, next), 2))} cm`}
                  />
                );
              })}
            </div>
          </LivePanel>

          <span className="block h-px w-full bg-white/12" />

          <LivePanel title="CONTORNO × INTERIOR">
            <StatLine label="PERÍMETRO" value={`${formatNumber(round(perimeter, 2))} cm`} />
            <StatLine label="ÁREA (interna)" value={`${formatNumber(round(area, 2))} cm²`} />
          </LivePanel>

          <HintPanel title={META.hintTitle} text={META.hint} />
        </>
      }
    >
      {journey === 0 ? (
        <PerimeterScene variant={variant} points={points} />
      ) : journey === 1 ? (
        <WalkScene points={points} perimeter={perimeter} />
      ) : journey === 2 ? (
        <ExamplesScene />
      ) : (
        <ApplicationsScene />
      )}
    </ConceptShell>
  );
}

function PerimeterScene({ variant, points }: { variant: VariantId; points: Point[] }) {
  const pad = 2;
  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  const viewBox = `${bounds.minX - pad} ${bounds.minY - pad} ${
    bounds.maxX - bounds.minX + pad * 2
  } ${bounds.maxY - bounds.minY + pad * 2}`;

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={viewBox}
        className="atlas-surface min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Polígono com vértices arrastáveis e contorno destacado"
      >
        <defs>
          <pattern id="per-hatch" width="0.5" height="0.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="0.5" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.06" />
          </pattern>
        </defs>

        <polygon points={polygon} fill="url(#per-hatch)" />
        <polygon
          points={polygon}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.28"
          strokeWidth="1"
          strokeDasharray="3 6"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) => {
          const next = points[(index + 1) % points.length];
          return (
            <DimensionLabel
              key={`label-${variant}-${index}`}
              a={point}
              b={next}
              text={`${formatNumber(round(distance(point, next), 2))}`}
              offset={-0.72}
              fontSize={0.68}
              opacity={0.7}
            />
          );
        })}

        {points.map((point, index) => {
          const next = points[(index + 1) % points.length];
          return (
            <g key={`edge-${variant}-${index}`}>
              <line
                x1={point.x}
                y1={point.y}
                x2={next.x}
                y2={next.y}
                stroke="#ffffff"
                strokeWidth="2"
                strokeOpacity="0.95"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={point.x}
                y1={point.y}
                x2={next.x}
                y2={next.y}
                stroke="#ffffff"
                strokeWidth="6"
                strokeOpacity="0.08"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

        {points.map((point, index) => (
          <g key={`vertex-${variant}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={0.28}
              fill="#000000"
              stroke="#ffffff"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={point.x} cy={point.y} r={0.11} fill="#ffffff" />
          </g>
        ))}

      </svg>

      <p className="pt-2 text-center text-[10px] tracking-[0.28em] text-white/30">
        O CONTORNO É O PERÍMETRO · AJUSTE A FIGURA ACIMA
      </p>
    </div>
  );
}

function WalkScene({ points, perimeter }: { points: Point[]; perimeter: number }) {
  const [progress, setProgress] = useState(0.25);

  const cumulative = useMemo(() => {
    const lengths: number[] = [];
    let total = 0;
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      total += distance(points[i], next);
      lengths.push(total);
    }
    return { lengths, total };
  }, [points]);

  const target = progress * cumulative.total;
  let walker = points[0];
  let travelled = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const segment = distance(points[i], next);
    if (target <= cumulative.lengths[i]) {
      const t = segment === 0 ? 0 : (target - (cumulative.lengths[i] - segment)) / segment;
      walker = {
        x: points[i].x + (next.x - points[i].x) * t,
        y: points[i].y + (next.y - points[i].y) * t,
      };
      travelled = target;
      break;
    }
  }

  const traversedPath = () => {
    const parts: string[] = [`M ${points[0].x} ${points[0].y}`];
    let remaining = travelled;
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      const segment = distance(points[i], next);
      if (remaining >= segment) {
        parts.push(`L ${next.x} ${next.y}`);
        remaining -= segment;
      } else {
        const t = segment === 0 ? 0 : remaining / segment;
        parts.push(`L ${points[i].x + (next.x - points[i].x) * t} ${points[i].y + (next.y - points[i].y) * t}`);
        break;
      }
    }
    return parts.join(" ");
  };

  const pad = 1.6;
  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  const viewBox = `${bounds.minX - pad} ${bounds.minY - pad} ${
    bounds.maxX - bounds.minX + pad * 2
  } ${bounds.maxY - bounds.minY + pad * 2}`;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <svg
        viewBox={viewBox}
        className="min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Caminhada ao longo do contorno"
      >
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="#ffffff"
          fillOpacity="0.03"
          stroke="#ffffff"
          strokeOpacity="0.2"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={traversedPath()}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeOpacity="0.95"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <circle cx={walker.x} cy={walker.y} r={0.42} fill="#ffffff" />
        <circle cx={walker.x} cy={walker.y} r={0.9} fill="#ffffff" fillOpacity="0.14" />
      </svg>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-6">
          <span className="tabular font-display text-[17px] text-white">
            {formatNumber(round(travelled, 2))} cm percorridos
          </span>
          <span className="text-[10px] tracking-[0.26em] text-white/40">
            DE {formatNumber(round(perimeter, 2))} cm
          </span>
        </div>
        <input
          type="range"
          className="atlas-range"
          min={0}
          max={1}
          step={0.002}
          value={progress}
          aria-label="Percorrer o contorno"
          onChange={(event) => setProgress(Number(event.target.value))}
        />
        <p className="text-[12.5px] leading-relaxed text-white/45">
          O perímetro é o caminho completo. Ao dar a volta inteira, o total acumulado é
          exatamente P = {formatNumber(round(perimeter, 2))} cm.
        </p>
      </div>
    </div>
  );
}

const EXAMPLES = [
  {
    prompt: "Um retângulo tem 9 cm de base e 4 cm de altura. Qual é o perímetro?",
    steps: ["P = 2 × (9 + 4)", "P = 2 × 13", "P = 26 cm"],
  },
  {
    prompt: "Um quadrado tem 12 cm de lado. Qual é o perímetro?",
    steps: ["P = 4 × 12", "P = 48 cm"],
  },
  {
    prompt: "Um polígono tem lados 5 cm, 7 cm, 6 cm e 8 cm. Qual é o perímetro?",
    steps: ["P = 5 + 7 + 6 + 8", "P = 26 cm"],
  },
  {
    prompt: "Um retângulo tem perímetro 30 cm e base 9 cm. Qual é a altura?",
    steps: ["30 = 2 × (9 + h)", "15 = 9 + h", "h = 6 cm"],
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
      <p className="max-w-[560px] font-display text-[18px] font-light leading-[1.5] text-white">
        {example.prompt}
      </p>
      <div className="flex flex-col gap-2">
        {example.steps.map((step) => (
          <p key={step} className="tabular font-display text-[15px] tracking-[0.04em] text-white/60">
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
    title: "CERCA",
    text: "Um terreno retangular tem 25 m de frente e 40 m de fundo. Quantos metros de cerca cercam o terreno inteiro?",
    answer: "130 m",
    detail: "P = 2 × (25 + 40) = 130",
  },
  {
    title: "MOLDURA",
    text: "Uma foto tem 15 cm por 20 cm. Qual é o comprimento da moldura necessária?",
    answer: "70 cm",
    detail: "P = 2 × (15 + 20) = 70",
  },
  {
    title: "PISTA",
    text: "Uma pista retangular mede 80 m por 45 m. Quantos metros um atleta percorre em uma volta?",
    answer: "250 m",
    detail: "P = 2 × (80 + 45) = 250",
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
      <p className="max-w-[560px] text-[14px] leading-[1.75] text-white/60">{item.text}</p>
      <div className="flex flex-col gap-2">
        <p className="tabular font-display text-[22px] text-white">{item.answer}</p>
        <p className="tabular text-[12.5px] tracking-[0.05em] text-white/40">{item.detail}</p>
      </div>
    </div>
  );
}
