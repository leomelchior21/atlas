"use client";

import { useMemo, useState } from "react";
import { CONCEPTS } from "@/content/concepts";
import { formatNumber, round } from "@/lib/format";
import { classifyAngle, polar, type Point } from "@/lib/geometry";
import { beginSvgDrag, handleSliderKeys } from "@/components/geometry/useSvgDrag";
import { ConceptShell, HintPanel, LivePanel } from "./ConceptShell";
import { ChoiceTabs, EquationDisplay, StatLine, ValueSlider } from "./controls";

const META = CONCEPTS["geo-angles"];
const RAY = 9;

const CLASSES = [
  { id: "agudo", label: "AGUDO", range: "0° < α < 90°" },
  { id: "reto", label: "RETO", range: "α = 90°" },
  { id: "obtuso", label: "OBTUSO", range: "90° < α < 180°" },
  { id: "raso", label: "RASO", range: "α = 180°" },
  { id: "côncavo", label: "CÔNCAVO", range: "180° < α < 360°" },
] as const;

function classify(deg: number): string {
  const base = classifyAngle(deg, 0.75);
  if (base === "nulo") return "agudo";
  if (base === "raso") return "raso";
  if (deg > 180) return "côncavo";
  return base;
}

export function AnglesConcept({ onLeave }: { onLeave: () => void }) {
  const [journey, setJourney] = useState(0);
  const [angle, setAngle] = useState(52);
  const clamped = Math.max(3, Math.min(357, angle));
  const klass = classify(clamped);

  return (
    <ConceptShell
      meta={META}
      journey={journey}
      onJourney={(index) => (index < 0 ? onLeave() : setJourney(index))}
      equation={
        <EquationDisplay
          main={`α = ${formatNumber(round(clamped, 1))}°`}
          live={klass.toUpperCase()}
        />
      }
      controls={
        <>
          <LivePanel title="CLASSIFICAÇÃO">
            <ul className="flex flex-col gap-2 pt-1">
              {CLASSES.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-baseline justify-between gap-3 text-[11.5px] transition-opacity ${
                    klass === item.id ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <span
                    className={`tracking-[0.22em] ${
                      klass === item.id ? "text-white" : "text-white/70"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="tabular text-[11px] text-white/45">{item.range}</span>
                </li>
              ))}
            </ul>
          </LivePanel>

          <span className="block h-px w-full bg-white/12" />

          <LivePanel title="MEDIDAS RELACIONADAS">
            <StatLine
              label="COMPLEMENTO"
              value={clamped < 90 ? `${formatNumber(round(90 - clamped, 1))}°` : "—"}
            />
            <StatLine
              label="SUPLEMENTO"
              value={clamped < 180 ? `${formatNumber(round(180 - clamped, 1))}°` : "—"}
            />
            <StatLine label="VOLTA COMPLETA" value={`${formatNumber(360 - round(clamped, 1))}°`} />
          </LivePanel>

          <HintPanel title={META.hintTitle} text={META.hint} />
        </>
      }
    >
      {journey === 0 ? (
        <AngleScene angle={clamped} setAngle={setAngle} klass={klass} />
      ) : journey === 1 ? (
        <LadderScene angle={clamped} setAngle={setAngle} klass={klass} />
      ) : journey === 2 ? (
        <ExamplesScene />
      ) : (
        <ApplicationsScene />
      )}
    </ConceptShell>
  );
}

function arcPath(radius: number, fromDeg: number, toDeg: number): string {
  const from = polar({ x: 0, y: 0 }, radius, (fromDeg * Math.PI) / 180);
  const to = polar({ x: 0, y: 0 }, radius, (toDeg * Math.PI) / 180);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  const sweep = toDeg > fromDeg ? 1 : 0;
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} ${sweep} ${to.x} ${to.y}`;
}

function AngleScene({
  angle,
  setAngle,
  klass,
}: {
  angle: number;
  setAngle: (value: number) => void;
  klass: string;
}) {
  const [dragging, setDragging] = useState(false);
  const movable: Point = useMemo(
    () => polar({ x: 0, y: 0 }, RAY, (angle * Math.PI) / 180),
    [angle],
  );
  const fixed: Point = { x: RAY, y: 0 };

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox="-3 -3 19 19"
        className="atlas-surface min-h-0 flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Ângulo de ${round(angle, 1)} graus, classificado como ${klass}`}
      >
        <circle
          r={RAY}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.08"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="2 8"
        />
        <path
          d={arcPath(RAY * 0.62, 0, angle)}
          fill="#ffffff"
          fillOpacity={0.07}
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={arcPath(RAY * 0.62, angle, 360)}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.12"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="3 6"
        />

        <line
          x1={0}
          y1={0}
          x2={fixed.x}
          y2={fixed.y}
          stroke="#ffffff"
          strokeOpacity="0.85"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          y1={0}
          x2={movable.x}
          y2={movable.y}
          stroke="#ffffff"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />

        <circle r="4.5" fill="#ffffff" fillOpacity="0.08" />
        <circle r="1.6" fill="#ffffff" />

        <text
          x={movable.x * 1.24}
          y={movable.y * 1.24}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fontSize="1.05"
          fillOpacity="0.5"
        >
          B
        </text>
        <text x={RAY * 1.12} y="0.4" textAnchor="middle" fill="#ffffff" fontSize="1.05" fillOpacity="0.5">
          A
        </text>

        <text
          x={Math.cos(((angle / 2) * Math.PI) / 180) * RAY * 0.82}
          y={Math.sin(((angle / 2) * Math.PI) / 180) * RAY * 0.82}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fontSize="1.15"
          fontStyle="italic"
        >
          {formatNumber(round(angle, 1))}°
        </text>

        <g
          onPointerDown={(event) => {
            setDragging(true);
            beginSvgDrag(
              event,
              (point) => {
                const deg = (Math.atan2(point.y, point.x) * 180) / Math.PI;
                const normalized = deg < 0 ? deg + 360 : deg;
                setAngle(Math.round(normalized * 2) / 2);
              },
              () => setDragging(false),
            );
          }}
          className="cursor-grab"
          role="slider"
          aria-label="Arraste ou use as setas para girar a semirreta"
          aria-valuetext={`${round(angle, 1)} graus`}
          tabIndex={0}
          onKeyDown={(event) =>
            handleSliderKeys(event, {
              onDelta: (dx) => setAngle(Math.max(3, Math.min(357, angle + dx * 2))),
              step: 1,
              fastStep: 5,
            })
          }
        >
          <circle cx={movable.x} cy={movable.y} r={1.4} fill="transparent" />
          <circle
            cx={movable.x}
            cy={movable.y}
            r={dragging ? 0.62 : 0.5}
            fill="#000000"
            stroke="#ffffff"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={movable.x} cy={movable.y} r={0.22} fill="#ffffff" />
        </g>
      </svg>

      <p className="pt-2 text-center text-[10px] tracking-[0.28em] text-white/30">
        ARRASTE A SEMIRRETA B
      </p>
    </div>
  );
}

function LadderScene({
  angle,
  setAngle,
  klass,
}: {
  angle: number;
  setAngle: (value: number) => void;
  klass: string;
}) {
  const zones = [
    { from: 0, to: 90, id: "agudo" },
    { from: 90, to: 90.001, id: "reto" },
    { from: 90, to: 180, id: "obtuso" },
    { from: 180, to: 360, id: "côncavo" },
  ];
  const width = 340;
  const x = (value: number) => 20 + (value / 360) * (width - 40);

  return (
    <div className="flex h-full w-full flex-col justify-center gap-8">
      <svg viewBox={`0 0 ${width} 120`} className="w-full" role="img" aria-label="Escala de ângulos">
        {zones.map((zone) => (
          <line
            key={`${zone.id}-${zone.from}`}
            x1={x(zone.from)}
            y1={54}
            x2={x(zone.to)}
            y2={54}
            stroke="#ffffff"
            strokeOpacity={zone.id === klass ? 0.85 : 0.25}
            strokeWidth={zone.id === klass ? 2 : 1.2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {[0, 45, 90, 135, 180, 270, 360].map((tick) => (
          <g key={tick}>
            <line
              x1={x(tick)}
              y1={48}
              x2={x(tick)}
              y2={60}
              stroke="#ffffff"
              strokeOpacity="0.3"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={x(tick)}
              y={74}
              textAnchor="middle"
              fill="#ffffff"
              fillOpacity="0.35"
              fontSize="9"
              letterSpacing="0.08em"
            >
              {tick}°
            </text>
          </g>
        ))}
        <g transform={`translate(${x(angle)} 54)`}>
          <line y1="-16" y2="16" stroke="#ffffff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <circle cy="-22" r="3.4" fill="#ffffff" />
          <text
            y="-32"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="11.5"
            letterSpacing="0.06em"
          >
            {formatNumber(round(angle, 1))}°
          </text>
        </g>
        <g>
          <text x={x(45)} y={30} textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="9.5" letterSpacing="0.2em">
            AGUDO
          </text>
          <text x={x(135)} y={30} textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="9.5" letterSpacing="0.2em">
            OBTUSO
          </text>
          <text x={x(270)} y={30} textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="9.5" letterSpacing="0.2em">
            CÔNCAVO
          </text>
        </g>
      </svg>

      <div className="px-6">
        <ValueSlider
          symbol="α"
          value={angle}
          min={3}
          max={357}
          step={0.5}
          display={`${formatNumber(round(angle, 1))}°`}
          onChange={setAngle}
          accent
        />
      </div>

      <p className="max-w-[520px] self-center text-center text-[12.5px] leading-relaxed text-white/45">
        Percorra a escala e observe o instante exato em que o ângulo muda de nome. 90° e 180° são
        fronteiras: nelas o ângulo é reto e raso, não agudo nem obtuso.
      </p>
    </div>
  );
}

const EXAMPLES = [
  {
    prompt: "Dois ângulos são complementares. Um mede 37°. Qual é o outro?",
    steps: ["x + 37° = 90°", "x = 90° − 37°", "x = 53°"],
  },
  {
    prompt: "Dois ângulos são suplementares. Um mede 124°. Qual é o outro?",
    steps: ["x + 124° = 180°", "x = 180° − 124°", "x = 56°"],
  },
  {
    prompt: "A bissetriz de um ângulo de 76° foi traçada. Qual é a medida de cada parte?",
    steps: ["x = 76° ÷ 2", "x = 38°"],
  },
  {
    prompt: "Um ângulo mede 148°. Como ele é classificado?",
    steps: ["90° < 148° < 180°", "obtuso"],
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
      <p className="max-w-[560px] font-display text-[19px] font-light leading-[1.5] text-white">
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
    title: "BÚSSOLA",
    text: "Uma bússola marca norte a 0° e o caminhante segue a 135°. Quanto ele girou em relação ao leste (90°)?",
    answer: "45°",
  },
  {
    title: "ABERTURA DE PORTA",
    text: "Uma porta abre 96°. Que tipo de ângulo ela forma com o batente?",
    answer: "obtuso",
  },
  {
    title: "RAMPA",
    text: "Uma rampa sobe com inclinação de 12° em relação ao chão. Ela é aguda ou obtusa?",
    answer: "aguda",
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
      <p className="tabular font-display text-[22px] text-white">{item.answer}</p>
    </div>
  );
}
