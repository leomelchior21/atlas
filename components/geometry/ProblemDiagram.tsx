"use client";

import { useMemo } from "react";
import { boundingBox, distance, type Point } from "@/lib/geometry";
import type { DiagramSpec } from "@/engine/problems/types";
import { AngleArc, DimensionLabel, RightAngleMarker, Segment } from "./primitives";

export function ProblemDiagram({ spec }: { spec: DiagramSpec }) {
  if (spec.kind === "none") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-[10px] tracking-[0.28em] text-white/20">
          RESOLVA NO PAPEL
        </span>
      </div>
    );
  }

  switch (spec.kind) {
    case "right-triangle":
      return <RightTriangleDiagram spec={spec} />;
    case "triangle-sides":
      return <TriangleSidesDiagram spec={spec} />;
    case "rectangle":
      return <RectangleDiagram spec={spec} />;
    case "polygon":
      return <PolygonDiagram spec={spec} />;
    case "angle":
      return <AngleDiagram spec={spec} />;
    case "circle":
      return <CircleDiagram spec={spec} />;
    case "l-shape":
      return <LShapedDiagram spec={spec} />;
    default:
      return null;
  }
}

function Frame({
  points,
  pad = 2,
  children,
  caption,
}: {
  points: Point[];
  pad?: number;
  children: React.ReactNode;
  caption?: string;
}) {
  const box = boundingBox(points);
  const width = Math.max(1, box.maxX - box.minX);
  const height = Math.max(1, box.maxY - box.minY);
  const scale = 10 / Math.max(width, height);
  const viewBox = `${box.minX - pad} ${box.minY - pad} ${width + pad * 2} ${
    height + pad * 2
  }`;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <svg
        viewBox={viewBox}
        className="min-h-0 w-full flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={caption ?? "Diagrama do problema"}
      >
        {children}
      </svg>
      {caption ? (
        <p className="mt-3 max-w-[420px] text-center text-[11px] leading-relaxed text-white/35">
          {caption}
        </p>
      ) : null}
      <span className="sr-only">{`escala visual ${scale.toFixed(2)}`}</span>
    </div>
  );
}

function RightTriangleDiagram({
  spec,
}: {
  spec: Extract<DiagramSpec, { kind: "right-triangle" }>;
}) {
  const { legA, legB, labelA, labelB, labelC, orientation, caption } = spec;
  const flip = orientation === "right";
  const V: Point = { x: 0, y: 0 };
  const A: Point = { x: flip ? legA : 0, y: -legB };
  const B: Point = { x: flip ? 0 : legA, y: 0 };
  const pad = Math.max(legA, legB) * 0.26;

  return (
    <Frame points={[V, A, B]} pad={pad} caption={caption}>
      <polygon
        points={[V, A, B].map((p) => `${p.x},${p.y}`).join(" ")}
        fill="#ffffff"
        fillOpacity="0.05"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      <RightAngleMarker vertex={V} armA={A} armB={B} size={Math.min(legA, legB) * 0.18} />
      <DimensionLabel
        a={{ x: 0, y: 0 }}
        b={{ x: 0, y: -legB }}
        text={labelA}
        offset={flip ? pad * 0.55 : -pad * 0.55}
        fontSize={pad * 0.42}
      />
      <DimensionLabel
        a={V}
        b={B}
        text={labelB}
        offset={pad * 0.5}
        fontSize={pad * 0.42}
      />
      <DimensionLabel
        a={A}
        b={B}
        text={labelC}
        offset={-pad * 0.5}
        fontSize={pad * 0.42}
      />
      <Segment a={V} b={A} opacity={0.9} width={1.2} />
      <Segment a={V} b={B} opacity={0.9} width={1.2} />
      <Segment a={A} b={B} opacity={0.95} width={1.4} />
      {[V, A, B].map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={pad * 0.075} fill="#ffffff" />
      ))}
    </Frame>
  );
}

function triangleFromSides(sides: [number, number, number]): Point[] {
  const [s0, s1, s2] = sides;
  const max = Math.max(s0, s1, s2);
  const x = (s2 * s2 - s1 * s1 + s0 * s0) / (2 * s0);
  const ySquared = s2 * s2 - x * x;
  if (!Number.isFinite(ySquared) || ySquared <= 0 || s0 <= 0) {
    return [
      { x: 0, y: 0 },
      { x: max, y: 0 },
      { x: max / 2, y: -max * 0.8 },
    ];
  }
  return [
    { x: 0, y: 0 },
    { x: s0, y: 0 },
    { x, y: -Math.sqrt(ySquared) },
  ];
}

function TriangleSidesDiagram({
  spec,
}: {
  spec: Extract<DiagramSpec, { kind: "triangle-sides" }>;
}) {
  const points = useMemo(() => triangleFromSides(spec.sides), [spec.sides]);
  const box = boundingBox(points);
  const pad = Math.max(box.maxX - box.minX, box.maxY - box.minY) * 0.22;
  const rightIndex = spec.rightAngleAt;

  return (
    <Frame points={points} pad={pad} caption={spec.caption}>
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
        const next = points[(index + 1) % 3];
        const label = spec.labels[index];
        if (!label) return null;
        const midpoint = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
        const isTop = midpoint.y < (box.minY + box.maxY) / 2;
        return (
          <text
            key={index}
            x={midpoint.x + (index === 2 ? 0 : 0)}
            y={midpoint.y + (isTop ? -pad * 0.4 : pad * 0.55)}
            textAnchor="middle"
            fill="#ffffff"
            fillOpacity="0.85"
            fontSize={pad * 0.42}
          >
            {label}
          </text>
        );
      })}
      {rightIndex !== undefined
        ? (() => {
            const vertex = points[rightIndex];
            const a = points[(rightIndex + 1) % 3];
            const b = points[(rightIndex + 2) % 3];
            return (
              <RightAngleMarker
                vertex={vertex}
                armA={a}
                armB={b}
                size={Math.max(0.5, pad * 0.3)}
              />
            );
          })()
        : null}
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={pad * 0.07} fill="#ffffff" />
      ))}
      <span className="hidden">{distance(points[0], points[1])}</span>
    </Frame>
  );
}

function RectangleDiagram({
  spec,
}: {
  spec: Extract<DiagramSpec, { kind: "rectangle" }>;
}) {
  const { width, height, labelWidth, labelHeight, labelDiagonal, diagonal } = spec;
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: -height },
    { x: 0, y: -height },
  ];
  const pad = Math.max(width, height) * 0.2;

  return (
    <Frame points={points} pad={pad} caption={spec.caption}>
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="#ffffff"
        fillOpacity="0.05"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      {diagonal ? (
        <>
          <Segment a={{ x: 0, y: 0 }} b={{ x: width, y: -height }} opacity={0.7} dash="5 4" />
          {labelDiagonal ? (
            <DimensionLabel
              a={{ x: 0, y: 0 }}
              b={{ x: width, y: -height }}
              text={labelDiagonal}
              offset={-pad * 0.5}
              fontSize={pad * 0.42}
            />
          ) : null}
        </>
      ) : null}
      {labelWidth ? (
        <DimensionLabel
          a={{ x: 0, y: 0 }}
          b={{ x: width, y: 0 }}
          text={labelWidth}
          offset={pad * 0.55}
          fontSize={pad * 0.42}
        />
      ) : null}
      {labelHeight ? (
        <DimensionLabel
          a={{ x: width, y: 0 }}
          b={{ x: width, y: -height }}
          text={labelHeight}
          offset={-pad * 0.3}
          fontSize={pad * 0.42}
        />
      ) : null}
      {[points[0], points[1], points[2], points[3]].map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={pad * 0.07} fill="#ffffff" />
      ))}
    </Frame>
  );
}

function PolygonDiagram({
  spec,
}: {
  spec: Extract<DiagramSpec, { kind: "polygon" }>;
}) {
  const sides = spec.sides;
  const points = useMemo<Point[]>(() => {
    if (sides.length === 4) {
      const [bottom, left, top, right] = sides;
      if (Math.abs(bottom - top) < 1e-6) {
        const skew = Math.min(left, right) * 0.45;
        return [
          { x: 0, y: 0 },
          { x: bottom, y: 0 },
          { x: bottom + skew, y: -left },
          { x: skew, y: -left },
        ];
      }
      const skew = Math.max(0, (bottom - top) / 2);
      return [
        { x: 0, y: 0 },
        { x: bottom, y: 0 },
        { x: top + skew, y: -left },
        { x: skew, y: -right },
      ];
    }
    const count = sides.length;
    return sides.map((_, index) => ({
      x: Math.cos((index / count) * Math.PI * 2 - Math.PI / 2) * 5,
      y: Math.sin((index / count) * Math.PI * 2 - Math.PI / 2) * 5,
    }));
  }, [sides]);

  const box = boundingBox(points);
  const pad = Math.max(box.maxX - box.minX, box.maxY - box.minY) * 0.22;

  return (
    <Frame points={points} pad={pad} caption={spec.caption}>
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
        const next = points[(index + 1) % points.length];
        const label = spec.labels?.[index];
        if (!label) return null;
        return (
          <DimensionLabel
            key={index}
            a={point}
            b={next}
            text={label}
            offset={pad * 0.5}
            fontSize={pad * 0.4}
          />
        );
      })}
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={pad * 0.07} fill="#ffffff" />
      ))}
    </Frame>
  );
}

function AngleDiagram({ spec }: { spec: Extract<DiagramSpec, { kind: "angle" }> }) {
  const radius = 5;
  const angle = Math.min(spec.degrees, 359);
  const end = {
    x: Math.cos((angle * Math.PI) / 180) * radius,
    y: -Math.sin((angle * Math.PI) / 180) * radius,
  };
  const points: Point[] = [{ x: -1, y: -1 }, { x: radius + 1, y: -radius - 1 }];

  return (
    <Frame points={points} pad={1.6} caption={spec.caption}>
      <line
        x1={0}
        y1={0}
        x2={radius}
        y2={0}
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={0}
        y1={0}
        x2={end.x}
        y2={end.y}
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      <AngleArc vertex={{ x: 0, y: 0 }} armA={{ x: radius, y: 0 }} armB={end} radius={radius * 0.5} />
      {spec.label ? (
        <text
          x={Math.cos(((angle / 2) * Math.PI) / 180) * radius * 0.7}
          y={-Math.sin(((angle / 2) * Math.PI) / 180) * radius * 0.7}
          textAnchor="middle"
          dy="0.34em"
          fill="#ffffff"
          fillOpacity="0.9"
          fontSize="0.75"
        >
          {spec.label}
        </text>
      ) : null}
      <circle cx={0} cy={0} r={0.16} fill="#ffffff" />
    </Frame>
  );
}

function CircleDiagram({ spec }: { spec: Extract<DiagramSpec, { kind: "circle" }> }) {
  const radius = 5;
  const points: Point[] = [
    { x: -radius, y: -radius },
    { x: radius, y: radius },
  ];
  return (
    <Frame points={points} pad={1.6} caption={spec.caption}>
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="#ffffff"
        fillOpacity="0.04"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={0}
        y1={0}
        x2={radius}
        y2={0}
        stroke="#ffffff"
        strokeOpacity="0.6"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
        strokeDasharray="4 4"
      />
      {spec.showDiameter ? (
        <line
          x1={-radius}
          y1={0}
          x2={radius}
          y2={0}
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <circle cx={0} cy={0} r={0.16} fill="#ffffff" />
      <text
        x={radius / 2}
        y={-0.5}
        textAnchor="middle"
        fill="#ffffff"
        fillOpacity="0.85"
        fontSize="0.8"
      >
        {spec.radiusLabel}
      </text>
    </Frame>
  );
}

function LShapedDiagram({
  spec,
}: {
  spec: Extract<DiagramSpec, { kind: "l-shape" }>;
}) {
  const { width, height, cutWidth, cutHeight } = spec;
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: width - cutWidth, y: 0 },
    { x: width - cutWidth, y: -cutHeight },
    { x: width, y: -cutHeight },
    { x: width, y: -height },
    { x: 0, y: -height },
  ];
  const pad = Math.max(width, height) * 0.2;
  const scale = 10 / Math.max(width, height);

  return (
    <Frame points={points} pad={pad} caption={spec.caption}>
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="#ffffff"
        fillOpacity="0.05"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={width / 2 - cutWidth / 4}
        y={-height / 2}
        textAnchor="middle"
        dy="0.34em"
        fill="#ffffff"
        fillOpacity="0.28"
        fontSize={pad * 0.4}
        letterSpacing="0.2em"
      >
        A
      </text>
      {[points[0], points[1], points[2], points[3], points[4], points[5]].map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={pad * 0.06} fill="#ffffff" />
      ))}
      <span className="hidden">{scale}</span>
    </Frame>
  );
}
