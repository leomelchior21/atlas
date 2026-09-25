"use client";

import type { Point } from "@/lib/geometry";
import { angleAtVertex, degrees, distance, polygonPerimeter } from "@/lib/geometry";

export const INK = "#ffffff";
export const LINE = "rgba(255,255,255,0.75)";

export function Segment({
  a,
  b,
  opacity = 0.85,
  dash,
  width = 1.2,
}: {
  a: Point;
  b: Point;
  opacity?: number;
  dash?: string;
  width?: number;
}) {
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={INK}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function PointHandle({
  point,
  label,
  onPointerDown,
  dragging,
  radius = 6,
  filled = true,
  ariaLabel,
  hint,
}: {
  point: Point;
  label?: string;
  onPointerDown?: (event: React.PointerEvent) => void;
  dragging?: boolean;
  radius?: number;
  filled?: boolean;
  ariaLabel?: string;
  hint?: string;
}) {
  return (
    <g
      className={onPointerDown ? "cursor-grab" : undefined}
      onPointerDown={onPointerDown}
      role={onPointerDown ? "slider" : undefined}
      aria-label={ariaLabel}
      aria-valuetext={hint}
      tabIndex={onPointerDown ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onPointerDown) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
          if (!rect) return;
          const synthetic = {
            currentTarget: event.currentTarget,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            nativeEvent: new PointerEvent("pointerdown", {
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            }),
            preventDefault: () => {},
            stopPropagation: () => {},
          } as unknown as React.PointerEvent;
          onPointerDown(synthetic);
        }
      }}
    >
      <circle cx={point.x} cy={point.y} r={radius * 2.6} fill="transparent" />
      <circle
        cx={point.x}
        cy={point.y}
        r={dragging ? radius + 1.5 : radius}
        fill={filled ? INK : "#000"}
        fillOpacity={filled ? 0.95 : 1}
        stroke={INK}
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
      {label ? (
        <text
          x={point.x}
          y={point.y}
          dx={radius + 8}
          dy={-radius - 4}
          fill={INK}
          fillOpacity="0.75"
          fontSize="11"
          letterSpacing="0.06em"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function RightAngleMarker({
  vertex,
  armA,
  armB,
  size = 16,
  opacity = 0.8,
}: {
  vertex: Point;
  armA: Point;
  armB: Point;
  size?: number;
  opacity?: number;
}) {
  const ua = unit(vertex, armA);
  const ub = unit(vertex, armB);
  const p1 = { x: vertex.x + ua.x * size, y: vertex.y + ua.y * size };
  const p2 = { x: vertex.x + ub.x * size, y: vertex.y + ub.y * size };
  const corner = { x: vertex.x + (ua.x + ub.x) * size, y: vertex.y + (ua.y + ub.y) * size };
  return (
    <path
      d={`M ${p1.x} ${p1.y} L ${corner.x} ${corner.y} L ${p2.x} ${p2.y}`}
      fill="none"
      stroke={INK}
      strokeOpacity={opacity}
      strokeWidth="1.1"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function AngleArc({
  vertex,
  armA,
  armB,
  radius = 34,
  label,
  labelOffset = 16,
  opacity = 0.8,
  filled = false,
}: {
  vertex: Point;
  armA: Point;
  armB: Point;
  radius?: number;
  label?: string;
  labelOffset?: number;
  opacity?: number;
  filled?: boolean;
}) {
  const ua = unit(vertex, armA);
  const ub = unit(vertex, armB);
  const start = { x: vertex.x + ua.x * radius, y: vertex.y + ua.y * radius };
  const end = { x: vertex.x + ub.x * radius, y: vertex.y + ub.y * radius };
  const sweep = cross(ua, ub) > 0 ? 1 : 0;
  const middle = bisector(ua, ub);
  const labelPoint = {
    x: vertex.x + middle.x * (radius + labelOffset),
    y: vertex.y + middle.y * (radius + labelOffset),
  };
  return (
    <g>
      <path
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`}
        fill={filled ? INK : "none"}
        fillOpacity={filled ? 0.08 : 0}
        stroke={INK}
        strokeOpacity={opacity}
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      {label ? (
        <text
          x={labelPoint.x}
          y={labelPoint.y}
          textAnchor="middle"
          dy="0.34em"
          fill={INK}
          fillOpacity="0.85"
          fontSize="11.5"
          letterSpacing="0.05em"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function DimensionLabel({
  a,
  b,
  text,
  offset = 20,
  align = "middle",
  opacity = 0.85,
  fontSize = 12,
}: {
  a: Point;
  b: Point;
  text: string;
  offset?: number;
  align?: "middle" | "start" | "end";
  opacity?: number;
  fontSize?: number;
}) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const normal = outwardNormal(a, b, offset);
  return (
    <text
      x={mid.x + normal.x}
      y={mid.y + normal.y}
      textAnchor={align}
      dy="0.34em"
      fill={INK}
      fillOpacity={opacity}
      fontSize={fontSize}
      letterSpacing="0.05em"
    >
      {text}
    </text>
  );
}

export function UnitGrid({
  origin,
  u,
  v,
  columns,
  rows,
  clipPathId,
}: {
  origin: Point;
  u: Point;
  v: Point;
  columns: number;
  rows: number;
  clipPathId?: string;
}) {
  const lines: Array<{ a: Point; b: Point; strong: boolean }> = [];
  for (let i = 0; i <= columns; i++) {
    lines.push({
      a: { x: origin.x + u.x * i, y: origin.y + u.y * i },
      b: { x: origin.x + u.x * i + v.x * rows, y: origin.y + u.y * i + v.y * rows },
      strong: i % 5 === 0,
    });
  }
  for (let j = 0; j <= rows; j++) {
    lines.push({
      a: { x: origin.x + v.x * j, y: origin.y + v.y * j },
      b: { x: origin.x + v.x * j + u.x * columns, y: origin.y + v.y * j + u.y * columns },
      strong: j % 5 === 0,
    });
  }
  return (
    <g clipPath={clipPathId ? `url(#${clipPathId})` : undefined}>
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.a.x}
          y1={line.a.y}
          x2={line.b.x}
          y2={line.b.y}
          stroke={INK}
          strokeOpacity={line.strong ? 0.16 : 0.07}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

export function PolygonShape({
  points,
  fillOpacity = 0.04,
  strokeOpacity = 0.85,
  dash,
}: {
  points: Point[];
  fillOpacity?: number;
  strokeOpacity?: number;
  dash?: string;
}) {
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  return (
    <path
      d={d}
      fill={INK}
      fillOpacity={fillOpacity}
      stroke={INK}
      strokeOpacity={strokeOpacity}
      strokeWidth="1.2"
      strokeDasharray={dash}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function CircleShape({
  center,
  radius,
  fillOpacity = 0,
  strokeOpacity = 0.8,
  dash,
}: {
  center: Point;
  radius: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  dash?: string;
}) {
  return (
    <circle
      cx={center.x}
      cy={center.y}
      r={radius}
      fill={INK}
      fillOpacity={fillOpacity}
      stroke={INK}
      strokeOpacity={strokeOpacity}
      strokeWidth="1.2"
      strokeDasharray={dash}
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function VertexDots({ points, radius = 3 }: { points: Point[]; radius?: number }) {
  return (
    <g>
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={radius} fill={INK} fillOpacity="0.8" />
      ))}
    </g>
  );
}

export function perimeterLabel(points: Point[]): string {
  return polygonPerimeter(points).toFixed(1);
}

export function angleLabel(a: Point, vertex: Point, b: Point): string {
  return `${degrees(angleAtVertex(a, vertex, b)).toFixed(0)}°`;
}

export function sideLabel(a: Point, b: Point): string {
  return distance(a, b).toFixed(1);
}

/* -------------------------------------------------------------- helpers */

function unit(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function bisector(a: Point, b: Point): Point {
  const sum = { x: a.x + b.x, y: a.y + b.y };
  const length = Math.hypot(sum.x, sum.y) || 1;
  return { x: sum.x / length, y: sum.y / length };
}

function outwardNormal(a: Point, b: Point, offset: number): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: (dy / length) * offset, y: (-dx / length) * offset };
}
