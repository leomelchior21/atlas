"use client";

import { useEffect, useMemo, useState } from "react";
import { CONCEPTS } from "@/content/concepts";
import { formatNumber, round } from "@/lib/format";
import {
  angleAtVertex,
  classifyTriangleSides,
  degrees,
  distance,
  triangleArea,
  type Point,
} from "@/lib/geometry";
import { beginSvgDrag, handleSliderKeys } from "@/components/geometry/useSvgDrag";
import { AngleArc, DimensionLabel } from "@/components/geometry/primitives";
import { ConceptShell, HintPanel, LivePanel } from "./ConceptShell";
import { ChoiceTabs, EquationDisplay, StatLine } from "./controls";

const META = CONCEPTS["geo-triangles"];

const REST: Point[] = [
  { x: 0.6, y: 5.4 },
  { x: 9.4, y: 5.4 },
  { x: 5.6, y: 0.4 },
];

export function TrianglesConcept({ onLeave }: { onLeave: () => void }) {
  const [journey, setJourney] = useState(0);
  const [points, setPoints] = useState<Point[]>(REST);
  const [dragging, setDragging] = useState<number | null>(null);

  const [a, b, c] = [distance(points[1], points[2]), distance(points[0], points[2]), distance(points[0], points[1])];
  const sides = [a, b, c];
  const angles = [
    degrees(angleAtVertex(points[1], points[0], points[2])),
    degrees(angleAtVertex(points[0], points[1], points[2])),
    degrees(angleAtVertex(points[0], points[2], points[1])),
  ];
  const sum = angles[0] + angles[1] + angles[2];
  const sideClass = classifyTriangleSides(a, b, c);
  const angleClass =
    Math.max(...angles) > 90.5 ? "Obtusângulo" : Math.abs(Math.max(...angles) - 90) <= 0.6 ? "Retângulo" : "Acutângulo";

  const update = (index: number, point: Point) => {
    setPoints((current) => {
      const next = [...current];
      const clamped = {
        x: Math.max(-0.8, Math.min(10.8, point.x)),
        y: Math.max(-0.8, Math.min(7.2, point.y)),
      };
      next[index] = clamped;
      if (triangleArea(next[0], next[1], next[2]) < 1.2) return current;
      return next;
    });
  };

  return (
    <ConceptShell
      meta={META}
      journey={journey}
      onJourney={(index) => (index < 0 ? onLeave() : setJourney(index))}
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
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <p className="micro">PELOS LADOS</p>
                <p className="font-display text-[16px] text-white">{sideClass}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="micro">PELOS ÂNGULOS</p>
                <p className="font-display text-[16px] text-white">{angleClass}</p>
              </div>
            </div>
          </LivePanel>

          <span className="block h-px w-full bg-white/12" />

          <LivePanel title="MEDIDAS">
            <div className="flex flex-col pt-1">
              <StatLine label="LADO a" value={`${formatNumber(round(a, 2))} cm`} />
              <StatLine label="LADO b" value={`${formatNumber(round(b, 2))} cm`} />
              <StatLine label="LADO c" value={`${formatNumber(round(c, 2))} cm`} />
              <StatLine label="SOMA DOS ÂNGULOS" value={`${formatNumber(round(sum, 1))}°`} />
              <StatLine label="ÁREA" value={`${formatNumber(round(triangleArea(points[0], points[1], points[2]), 2))} cm²`} />
            </div>
          </LivePanel>

          <HintPanel title={META.hintTitle} text={META.hint} />
        </>
      }
    >
      {journey === 0 ? (
        <TriangleScene
          points={points}
          angles={angles}
          dragging={dragging}
          setDragging={setDragging}
          onDrag={update}
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

function TriangleScene({
  points,
  angles,
  dragging,
  setDragging,
  onDrag,
}: {
  points: Point[];
  angles: number[];
  dragging: number | null;
  setDragging: (index: number | null) => void;
  onDrag: (index: number, point: Point) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox="-1.6 -1.6 13.6 10.4"
        className="atlas-surface min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Triângulo com vértices arrastáveis"
      >
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="#ffffff"
          fillOpacity="0.05"
          stroke="#ffffff"
          strokeOpacity="0.85"
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) => {
          const prev = points[(index + 2) % 3];
          const next = points[(index + 1) % 3];
          const radius = index === 2 ? 1.1 : 1.3;
          return (
            <AngleArc
              key={`arc-${index}`}
              vertex={point}
              armA={next}
              armB={prev}
              radius={radius}
              label={`${angles[index].toFixed(0)}°`}
              labelOffset={0.5}
              filled={Math.abs(angles[index] - 90) < 0.8}
            />
          );
        })}

        {points.map((point, index) => {
          const next = points[(index + 1) % 3];
          return (
            <DimensionLabel
              key={`side-${index}`}
              a={point}
              b={next}
              text={`${distance(point, next).toFixed(1)}`}
              offset={-0.62}
              fontSize={0.58}
              opacity={0.6}
            />
          );
        })}

        {points.map((point, index) => (
          <g
            key={`vertex-${index}`}
            className="cursor-grab"
            role="slider"
            aria-label={`Vértice ${index + 1}: arraste ou use as setas`}
            aria-valuetext={`x ${points[index].x.toFixed(1)}, y ${points[index].y.toFixed(1)}`}
            tabIndex={0}
            onKeyDown={(event) =>
              handleSliderKeys(event, {
                onDelta: (dx, dy) =>
                  onDrag(index, { x: points[index].x + dx * 0.25, y: points[index].y + dy * 0.25 }),
                step: 1,
                fastStep: 4,
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
            <circle cx={point.x} cy={point.y} r={1.1} fill="transparent" />
            <circle
              cx={point.x}
              cy={point.y}
              r={dragging === index ? 0.42 : 0.32}
              fill="#000000"
              stroke="#ffffff"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={point.x} cy={point.y} r={0.12} fill="#ffffff" />
          </g>
        ))}
      </svg>

      <p className="pt-2 text-center text-[10px] tracking-[0.28em] text-white/30">
        ARRASTE OS VÉRTICES · A SOMA DOS ÂNGULOS NÃO MUDA
      </p>
    </div>
  );
}

function SumScene({ points, angles }: { points: Point[]; angles: number[] }) {
  const [progress, setProgress] = useState(0);
  const apex = { x: 0, y: 0 };
  const length = 4.4;
  const cumulative = [0, angles[0], angles[0] + angles[1]];

  const source = useMemo(
    () =>
      points.map((point, index) => {
        const prev = points[(index + 2) % 3];
        const next = points[(index + 1) % 3];
        const u1 = unit(point, prev);
        const u2 = unit(point, next);
        const bisector = normalize({ x: u1.x + u2.x, y: u1.y + u2.y });
        const rotation = (Math.atan2(bisector.y, bisector.x) * 180) / Math.PI;
        return { point, rotation };
      }),
    [points],
  );

  const wedge = (angle: number) => {
    const half = ((angle / 2) * Math.PI) / 180;
    const from = { x: Math.cos(-half) * length, y: Math.sin(-half) * length };
    const to = { x: Math.cos(half) * length, y: Math.sin(half) * length };
    return `M ${apex.x} ${apex.y} L ${from.x} ${from.y} A ${length} ${length} 0 0 1 ${to.x} ${to.y} Z`;
  };

  useEffect(() => {
    setProgress(0);
  }, [points]);

  const target = { x: 0, y: 0 };
  const targetY = 0;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <svg
        viewBox="-5.4 -5.2 10.8 11.4"
        className="min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Demonstração da soma dos ângulos internos"
      >
        <line
          x1={-length - 0.8}
          y1={targetY}
          x2={length + 0.8}
          y2={targetY}
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />

        {angles.map((angle, index) => {
          const from = source[index];
          const rotate = (from.rotation * Math.PI) / 180;
          const px = from.point.x * (1 - progress);
          const py = from.point.y * (1 - progress) - 1.2 * progress;
          const targetRotation = cumulative[index] + angle / 2;
          const rotation = from.rotation + (targetRotation - from.rotation) * progress;
          return (
            <g
              key={index}
              transform={`translate(${px} ${py}) rotate(${rotation})`}
              opacity={0.35 + 0.65 * (1 - Math.abs(progress - (index === 1 ? 0.6 : 0.35)))}
            >
              <path
                d={wedge(angle)}
                fill="#ffffff"
                fillOpacity={0.1 + 0.12 * progress}
                stroke="#ffffff"
                strokeOpacity="0.8"
                strokeWidth="1.1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

        {progress > 0.85 ? (
          <text
            x={0}
            y={length + 3.4}
            textAnchor="middle"
            fill="#ffffff"
            fillOpacity={(progress - 0.85) * 6}
            fontSize="1.5"
            letterSpacing="0.1em"
          >
            180°
          </text>
        ) : null}
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
        <p className="text-[12.5px] leading-relaxed text-white/50">
          Recorte mentalmente os três ângulos e encaixe-os lado a lado sobre uma reta. Eles
          preenchem exatamente o ângulo raso:{" "}
          <span className="text-white/80">
            {angles.map((a) => `${a.toFixed(0)}°`).join(" + ")} = 180°
          </span>
          .
        </p>
      </div>
    </div>
  );
}

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
    title: "RAMPA DE TELHADO",
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
      <p className="max-w-[560px] text-[14px] leading-[1.75] text-white/60">{item.text}</p>
      <div className="flex flex-col gap-2">
        <p className="tabular font-display text-[22px] text-white">{item.answer}</p>
        <p className="tabular text-[12.5px] tracking-[0.05em] text-white/40">{item.detail}</p>
      </div>
    </div>
  );
}

function unit(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y) || 1;
  return { x: point.x / length, y: point.y / length };
}
