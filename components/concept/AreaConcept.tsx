"use client";

import { useMemo, useState } from "react";
import { CONCEPTS } from "@/content/concepts";
import { formatNumber, round } from "@/lib/format";
import type { Point } from "@/lib/geometry";
import { DimensionLabel, UnitGrid } from "@/components/geometry/primitives";
import { ConceptShell, HintPanel, LivePanel } from "./ConceptShell";
import { ChoiceTabs, ControlBar, ControlGroup, EquationDisplay, StatLine, ValueSlider } from "./controls";

const META = CONCEPTS["geo-area"];

type ShapeId = "retangulo" | "triangulo" | "paralelogramo";

const SHAPES: Array<{ id: ShapeId; label: string; formula: string }> = [
  { id: "retangulo", label: "RETÂNGULO", formula: "A = b × h" },
  { id: "triangulo", label: "TRIÂNGULO", formula: "A = (b × h) ÷ 2" },
  { id: "paralelogramo", label: "PARALELOGRAMO", formula: "A = b × h" },
];

const PRESETS: Array<{ id: string; label: string; shape: ShapeId; base: number; height: number }> = [
  { id: "ret-8-5", label: "RETÂNGULO 8 × 5", shape: "retangulo", base: 8, height: 5 },
  { id: "tri-10-6", label: "TRIÂNGULO 10 × 6", shape: "triangulo", base: 10, height: 6 },
  { id: "par-7-4", label: "PARALELOGRAMO 7 × 4", shape: "paralelogramo", base: 7, height: 4 },
];

export function AreaConcept({ onLeave }: { onLeave: () => void }) {
  const [journey, setJourney] = useState(0);
  const [shape, setShape] = useState<ShapeId>("retangulo");
  const [base, setBase] = useState(6);
  const [height, setHeight] = useState(4);

  const area = shape === "triangulo" ? (base * height) / 2 : base * height;
  const shapeInfo = SHAPES.find((item) => item.id === shape)!;

  return (
    <ConceptShell
      meta={META}
      journey={journey}
      onJourney={(index) => (index < 0 ? onLeave() : setJourney(index))}
      toolbar={
        <ControlBar>
          <ControlGroup label="FORMA EM ESTUDO">
            <ChoiceTabs
              options={SHAPES.map((item) => ({ id: item.id, label: item.label }))}
              value={shape}
              onChange={setShape}
            />
          </ControlGroup>

          <ControlGroup label="AJUSTE AS DIMENSÕES" wide>
            <div className="flex flex-col gap-3">
              <ValueSlider
                symbol="b"
                value={base}
                min={2}
                max={10}
                step={1}
                onChange={(value) => setBase(Math.round(value))}
                display={formatNumber(base)}
              />
              <ValueSlider
                symbol="h"
                value={height}
                min={2}
                max={10}
                step={1}
                onChange={(value) => setHeight(Math.round(value))}
                display={formatNumber(height)}
              />
            </div>
          </ControlGroup>

          <ChoiceTabs
            label="OU VEJA UM EXEMPLO"
            options={PRESETS.map((preset) => ({ id: preset.id, label: preset.label }))}
            value={
              PRESETS.find(
                (preset) =>
                  preset.shape === shape && preset.base === base && preset.height === height,
              )?.id ?? ""
            }
            onChange={(id) => {
              const preset = PRESETS.find((entry) => entry.id === id);
              if (!preset) return;
              setShape(preset.shape);
              setBase(preset.base);
              setHeight(preset.height);
            }}
          />
        </ControlBar>
      }
      equation={
        <EquationDisplay
          main={shapeInfo.formula}
          live={
            shape === "triangulo"
              ? `(${formatNumber(base)} × ${formatNumber(height)}) ÷ 2 = ${formatNumber(round(area, 2))}`
              : `${formatNumber(base)} × ${formatNumber(height)} = ${formatNumber(round(area, 2))}`
          }
        />
      }
      controls={
        <>
          <LivePanel title="CONTAGEM">
            <StatLine label="UNIDADES COBERTAS" value={formatNumber(round(area, 2))} />
            <StatLine label="UNIDADES VAZIAS" value={formatNumber(round(base * height - area, 2))} />
            <StatLine label="ÁREA" value={`${formatNumber(round(area, 2))} cm²`} />
          </LivePanel>

          <HintPanel title={META.hintTitle} text={META.hint} />
        </>
      }
    >
      {journey === 0 ? (
        <AreaScene shape={shape} base={base} height={height} />
      ) : journey === 1 ? (
        <DerivationScene shape={shape} base={base} height={height} />
      ) : journey === 2 ? (
        <ExamplesScene shape={shape} onShape={setShape} onBase={setBase} onHeight={setHeight} onExplore={() => setJourney(0)} />
      ) : (
        <ApplicationsScene />
      )}
    </ConceptShell>
  );
}

function shapePoints(shape: ShapeId, base: number, height: number): Point[] {
  if (shape === "retangulo") {
    return [
      { x: 0, y: 0 },
      { x: base, y: 0 },
      { x: base, y: height },
      { x: 0, y: height },
    ];
  }
  if (shape === "triangulo") {
    return [
      { x: 0, y: 0 },
      { x: base, y: 0 },
      { x: base, y: height },
    ];
  }
  const skew = Math.min(2, base * 0.3);
  return [
    { x: 0, y: 0 },
    { x: base, y: 0 },
    { x: base + skew, y: height },
    { x: skew, y: height },
  ];
}

function AreaScene({ shape, base, height }: { shape: ShapeId; base: number; height: number }) {
  const points = useMemo(() => shapePoints(shape, base, height), [shape, base, height]);
  const skew = shape === "paralelogramo" ? Math.min(2, base * 0.3) : 0;
  const pad = 2;
  const viewBox = `${-pad} ${-pad} ${base + pad * 2 + skew} ${height + pad * 2}`;

  const handleX = { x: base, y: 0 };
  const handleY = { x: 0, y: height };

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={viewBox}
        className="atlas-surface min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Figura de base ${base} e altura ${height}`}
      >
        <defs>
          <clipPath id="area-clip">
            <polygon points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
          </clipPath>
        </defs>

        {shape === "triangulo" ? (
          <polygon
            points={`0,0 ${base},0 ${base},${height} 0,${height}`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.16"
            strokeWidth="1"
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="#ffffff"
          fillOpacity={shape === "triangulo" ? 0.07 : 0.05}
          stroke="#ffffff"
          strokeOpacity="0.85"
          strokeWidth="1.3"
          vectorEffect="non-scaling-stroke"
        />

        <UnitGrid
          origin={{ x: skew, y: 0 }}
          u={{ x: 1, y: 0 }}
          v={{ x: 0, y: 1 }}
          columns={Math.round(base + skew)}
          rows={Math.round(height)}
          clipPathId="area-clip"
        />

        <DimensionLabel
          a={{ x: 0, y: 0 }}
          b={{ x: base, y: 0 }}
          text={`b = ${formatNumber(base)}`}
          offset={height + 1.1}
          fontSize={0.85}
        />
        <DimensionLabel
          a={{ x: 0, y: 0 }}
          b={{ x: 0, y: height }}
          text={`h = ${formatNumber(height)}`}
          offset={-1.4}
          fontSize={0.85}
        />

        <text
          x={points.reduce((sum, p) => sum + p.x, 0) / points.length}
          y={points.reduce((sum, p) => sum + p.y, 0) / points.length}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fontSize={Math.min(base, height) * 0.24}
          fontStyle="italic"
          fillOpacity="0.9"
        >
          A
        </text>

        <g>
          <circle cx={handleX.x} cy={handleX.y} r={0.4} fill="#000" stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <circle cx={handleX.x} cy={handleX.y} r={0.18} fill="#fff" />
        </g>
        <g>
          <circle cx={handleY.x} cy={handleY.y} r={0.4} fill="#000" stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <circle cx={handleY.x} cy={handleY.y} r={0.18} fill="#fff" />
        </g>
      </svg>

      <p className="pt-2 text-center text-[10px] tracking-[0.28em] text-white/30">
        CONTE OS QUADRADOS · AJUSTE B E H NOS CONTROLES ACIMA
      </p>
    </div>
  );
}

function DerivationScene({
  shape,
  base,
  height,
}: {
  shape: ShapeId;
  base: number;
  height: number;
}) {
  const [step, setStep] = useState(0);
  const steps =
    shape === "triangulo"
      ? [
          "Comece com o retângulo de base b e altura h.",
          "A diagonal divide o retângulo em dois triângulos iguais.",
          "Por isso a área do triângulo é metade: (b × h) ÷ 2.",
        ]
      : shape === "paralelogramo"
        ? [
            "Recorte o triângulo que sobra à esquerda.",
            "Mova-o para a direita.",
            "O paralelogramo vira um retângulo de mesma base e altura: A = b × h.",
          ]
        : [
            "O retângulo é a figura de referência.",
            "Empilhe b colunas de h unidades.",
            "A = b × h, sem ajustes.",
          ];

  const cut = 1.5;
  const pad = 2.5;
  const viewBox = `${-pad} ${-pad} ${base + pad * 2 + 2.5} ${height + pad * 2}`;
  const showTriangle = shape === "triangulo" && step >= 1;
  const showMove = shape === "paralelogramo" && step >= 1;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <svg
        viewBox={viewBox}
        className="min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Derivação da fórmula da área"
      >
        <rect
          x={0}
          y={0}
          width={base}
          height={height}
          fill="#ffffff"
          fillOpacity="0.04"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeDasharray="5 5"
          vectorEffect="non-scaling-stroke"
        />
        <UnitGrid
          origin={{ x: 0, y: 0 }}
          u={{ x: 1, y: 0 }}
          v={{ x: 0, y: 1 }}
          columns={base}
          rows={height}
        />

        {shape === "retangulo" ? (
          <rect
            x={0}
            y={0}
            width={base}
            height={height}
            fill="#ffffff"
            fillOpacity="0.08"
            stroke="#ffffff"
            strokeOpacity="0.85"
            strokeWidth="1.3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}

        {shape === "triangulo" ? (
          <g>
            <polygon
              points={`0,0 ${base},0 ${base},${height}`}
              fill="#ffffff"
              fillOpacity="0.1"
              stroke="#ffffff"
              strokeOpacity="0.9"
              strokeWidth="1.3"
              vectorEffect="non-scaling-stroke"
            />
            {showTriangle ? (
              <polygon
                points={`0,0 ${base},${height} 0,${height}`}
                fill="#ffffff"
                fillOpacity="0.04"
                stroke="#ffffff"
                strokeOpacity="0.5"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <line
              x1={0}
              y1={0}
              x2={base}
              y2={height}
              stroke="#ffffff"
              strokeOpacity="0.8"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ) : null}

        {shape === "paralelogramo" ? (
          <g>
            <polygon
              points={`${cut},0 ${base + cut},0 ${base + cut},${height} ${cut},${height}`}
              fill="#ffffff"
              fillOpacity={step >= 2 ? 0.09 : 0.03}
              stroke="#ffffff"
              strokeOpacity="0.5"
              strokeWidth="1.2"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
            />
            <polygon
              points={`${cut},0 ${base},0 ${base + cut},${height} ${cut},${height}`}
              fill="#ffffff"
              fillOpacity="0.08"
              stroke="#ffffff"
              strokeOpacity="0.85"
              strokeWidth="1.3"
              vectorEffect="non-scaling-stroke"
            />
            <polygon
              points={`0,${height} ${cut},${height} ${cut},0`}
              fill="#ffffff"
              fillOpacity="0.16"
              stroke="#ffffff"
              strokeOpacity="0.9"
              strokeWidth="1.3"
              vectorEffect="non-scaling-stroke"
              transform={showMove ? `translate(${base} 0)` : undefined}
            />
          </g>
        ) : null}
      </svg>

      <div className="flex flex-col gap-3">
        <p className="text-[13.5px] leading-relaxed text-white/65">{steps[step]}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep(0)}
            className={`btn h-9 min-h-0 px-4 ${step === 0 ? "btn-solid" : ""}`}
          >
            1
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`btn h-9 min-h-0 px-4 ${step === 1 ? "btn-solid" : ""}`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`btn h-9 min-h-0 px-4 ${step === 2 ? "btn-solid" : ""}`}
          >
            3
          </button>
          <span className="tabular ml-4 font-display text-[14px] text-white/60">
            {shape === "triangulo"
              ? `A = (${base} × ${height}) ÷ 2 = ${formatNumber((base * height) / 2)}`
              : `A = ${base} × ${height} = ${formatNumber(base * height)}`}
          </span>
        </div>
      </div>
    </div>
  );
}

const EXAMPLES = [
  {
    shape: "retangulo" as ShapeId,
    base: 8,
    height: 5,
    prompt: "Um retângulo tem 8 cm de base e 5 cm de altura. Qual é a área?",
    steps: ["A = b × h", "A = 8 × 5", "A = 40 cm²"],
  },
  {
    shape: "triangulo" as ShapeId,
    base: 10,
    height: 6,
    prompt: "Um triângulo tem base 10 cm e altura 6 cm. Qual é a área?",
    steps: ["A = (b × h) ÷ 2", "A = (10 × 6) ÷ 2 = 60 ÷ 2", "A = 30 cm²"],
  },
  {
    shape: "paralelogramo" as ShapeId,
    base: 7,
    height: 4,
    prompt: "Um paralelogramo tem base 7 cm e altura 4 cm. Qual é a área?",
    steps: ["A = b × h", "A = 7 × 4", "A = 28 cm²"],
  },
];

function ExamplesScene({
  onShape,
  onBase,
  onHeight,
  onExplore,
}: {
  shape: ShapeId;
  onShape: (shape: ShapeId) => void;
  onBase: (value: number) => void;
  onHeight: (value: number) => void;
  onExplore: () => void;
}) {
  const [index, setIndex] = useState(0);
  const example = EXAMPLES[index];
  return (
    <div className="flex h-full w-full flex-col items-start justify-center gap-5">
      <p className="micro">
        EXEMPLO {index + 1} DE {EXAMPLES.length}
      </p>
      <p className="max-w-[560px] font-display text-[17px] font-light leading-[1.55] text-white">
        {example.prompt}
      </p>
      <div className="flex flex-col gap-2">
        {example.steps.map((step) => (
          <p
            key={step}
            className="tabular font-display text-[15px] tracking-[0.04em] text-white/60"
          >
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
        <button
          type="button"
          onClick={() => {
            onShape(example.shape);
            onBase(example.base);
            onHeight(example.height);
            onExplore();
          }}
          className="btn"
        >
          VER NO CONCEITO →
        </button>
      </div>
    </div>
  );
}

const APPLICATIONS = [
  {
    title: "PINTURA DE PAREDE",
    text: "Uma parede mede 4 m por 2,5 m. Cada lata de tinta cobre 5 m². Quantas latas são necessárias?",
    answer: "2 latas",
    detail: "A = 4 × 2,5 = 10 m² → 10 ÷ 5 = 2",
  },
  {
    title: "TERRENO",
    text: "Um terreno retangular tem 12 m de frente e 30 m de fundo. Qual é a área em metros quadrados?",
    answer: "360 m²",
    detail: "A = 12 × 30 = 360",
  },
  {
    title: "LAJOTA",
    text: "Uma lajota quadrada tem 40 cm de lado. Quantas são necessárias para cobrir 8 m²?",
    answer: "50 lajotas",
    detail: "lajota: 0,40 × 0,40 = 0,16 m² → 8 ÷ 0,16 = 50",
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
