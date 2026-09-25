"use client";

import { memo } from "react";
import { labelFor, SUB_RADIUS, TOPIC_RADIUS } from "@/content/layout";
import type { AtlasNode } from "@/types/content";

interface GlyphProps {
  node: AtlasNode;
  x: number;
  y: number;
  yearRelevant: boolean;
  mastered: boolean;
  explored: boolean;
  selected: boolean;
  interactive: boolean;
  onActivate: (id: string) => void;
  onHover?: (id: string | null) => void;
}

function labelOffset(node: AtlasNode): number {
  if (node.depth === 0) return 48;
  if (node.depth === 1) return 36;
  if (node.depth === 2) return 28;
  return 22;
}

function Label({
  node,
  radius,
  opacity,
}: {
  node: AtlasNode;
  radius: number;
  opacity: number;
}) {
  const { position, offset } = labelFor(node);
  const gap = labelOffset(node) + offset;
  const className =
    node.depth === 0
      ? "atlas-label atlas-label-subject"
      : node.depth === 1
        ? "atlas-label atlas-label-domain"
        : node.depth === 2
          ? "atlas-label atlas-label-concept"
          : "atlas-label atlas-label-sub";

  if (position === "top" || position === "bottom") {
    const sign = position === "top" ? -1 : 1;
    return (
      <text
        className={className}
        x={0}
        y={sign * (radius + gap)}
        textAnchor="middle"
        dy={position === "top" ? "0.1em" : "0.78em"}
        fillOpacity={opacity}
      >
        {node.title}
      </text>
    );
  }

  const sign = position === "left" ? -1 : 1;
  return (
    <text
      className={className}
      x={sign * (radius + gap)}
      y={0}
      textAnchor={position === "left" ? "end" : "start"}
      dy="0.34em"
      fillOpacity={opacity}
    >
      {node.title}
    </text>
  );
}

function AtlasNodeGlyphBase({
  node,
  x,
  y,
  yearRelevant,
  mastered,
  explored,
  selected,
  interactive,
  onActivate,
  onHover,
}: GlyphProps) {
  const handle = () => onActivate(node.id);
  const isPlaceholder = node.status === "placeholder";

  const label = `${node.title}${isPlaceholder ? " — território em mapeamento" : ""}`;
  const common = interactive
    ? {
        className: "atlas-node-body",
        transform: `translate(${x} ${y})`,
        "aria-label": label,
        tabIndex: 0,
        role: "button" as const,
        onClick: handle,
        onPointerEnter: () => onHover?.(node.id),
        onPointerLeave: () => onHover?.(null),
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handle();
          }
        },
      }
    : {
        className: "atlas-node-body",
        transform: `translate(${x} ${y})`,
        "aria-label": label,
        style: { pointerEvents: "none" as const },
      };

  const yearHalo = yearRelevant ? (
    <circle
      className="year-pulse"
      r={node.depth === 0 ? 250 * 1.06 : node.depth === 1 ? 92 * 1.14 : TOPIC_RADIUS * 1.3}
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.25"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
  ) : null;

  const masteryRing = mastered ? (
    <circle
      r={node.depth <= 1 ? 92 * 0.82 : TOPIC_RADIUS * 0.86}
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.6"
      strokeWidth="1"
      strokeDasharray="2 6"
      vectorEffect="non-scaling-stroke"
    />
  ) : null;

  const selection = selected ? (
    <>
      <circle
        r={node.depth === 0 ? 250 * 1.06 : node.depth === 1 ? 92 * 1.14 : TOPIC_RADIUS * 1.4}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="breathe"
        r={node.depth === 0 ? 250 * 1.12 : node.depth === 1 ? 92 * 1.2 : TOPIC_RADIUS * 1.5}
        fill="#ffffff"
        fillOpacity="0.05"
      />
    </>
  ) : null;

  /* ------------------------------------------------------- subject island */

  if (node.depth === 0) {
    const R = 250;
    return (
      <g {...common}>
        <circle r={R + 20} fill="transparent" />
        {selection}
        {yearHalo}

        <g className="orbit-slow">
          <circle
            r={R}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.34"
            strokeWidth="1"
            strokeDasharray="1.5 11"
            vectorEffect="non-scaling-stroke"
          />
          <circle r="3.6" cy={-R} fill="#ffffff" fillOpacity="0.9" />
        </g>

        <g className="orbit-med">
          <circle
            r={R * 0.76}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.3"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={R * 0.76 * Math.cos(2.2)}
            cy={R * 0.76 * Math.sin(2.2)}
            r="2.6"
            fill="#ffffff"
            fillOpacity="0.6"
          />
        </g>

        <circle
          className="ring-shift"
          r={R * 0.48}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        <circle className="breathe" r={R * 0.3} fill="#ffffff" fillOpacity="0.05" />
        <circle
          className="atlas-node-core"
          r={explored ? 15 : 13}
          fill="#ffffff"
          fillOpacity={selected ? 1 : 0.92}
        />
        {masteryRing}
        <Label node={node} radius={R} opacity={selected ? 1 : 0.94} />
      </g>
    );
  }

  /* -------------------------------------------------------- domain island */

  if (node.depth === 1) {
    const R = 92;
    return (
      <g {...common}>
        <circle r={R + 18} fill="transparent" />
        {selection}
        {yearHalo}

        <g className="orbit-med">
          <circle
            r={R}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={isPlaceholder ? 0.24 : 0.4}
            strokeWidth="1"
            strokeDasharray={isPlaceholder ? "2 13" : "1.5 9"}
            vectorEffect="non-scaling-stroke"
          />
          <circle r="2.6" cy={-R} fill="#ffffff" fillOpacity="0.75" />
        </g>

        <circle
          r={R * 0.62}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.26"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <circle className="breathe" r={R * 0.34} fill="#ffffff" fillOpacity="0.05" />
        <circle
          className="atlas-node-core"
          r={selected ? 9 : 7.5}
          fill={isPlaceholder ? "none" : "#ffffff"}
          stroke="#ffffff"
          strokeOpacity={isPlaceholder ? 0.66 : 1}
          vectorEffect="non-scaling-stroke"
        />
        {masteryRing}
        <Label node={node} radius={R} opacity={selected ? 1 : 0.88} />
      </g>
    );
  }

  /* --------------------------------------------------- concept / branch */

  const R = node.depth === 2 ? TOPIC_RADIUS : SUB_RADIUS;
  const isConcept = node.hasConcept;
  return (
    <g {...common}>
      <circle r={R + 16} fill="transparent" />
      {selection}
      {yearHalo}
      <circle
        r={R}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={isPlaceholder ? 0.26 : isConcept ? 0.5 : 0.34}
        strokeWidth="1"
        strokeDasharray={isPlaceholder ? "2 8" : isConcept ? undefined : "3 6"}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="atlas-node-core"
        r={selected ? R * 0.3 : isConcept ? R * 0.24 : R * 0.2}
        fill={isPlaceholder ? "none" : "#ffffff"}
        stroke="#ffffff"
        strokeOpacity={isPlaceholder ? 0.6 : 1}
        vectorEffect="non-scaling-stroke"
      />
      {explored && node.depth === 2 ? (
        <circle r={R * 0.5} fill="#ffffff" fillOpacity="0.28" />
      ) : null}
      {masteryRing}
      <Label node={node} radius={R} opacity={selected ? 1 : isConcept ? 0.92 : 0.74} />
    </g>
  );
}

export const AtlasNodeGlyph = memo(AtlasNodeGlyphBase);
