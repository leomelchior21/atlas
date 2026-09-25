"use client";

import { memo } from "react";
import { ATLAS } from "@/content";
import type { AtlasNode } from "@/types/content";

const SUBJECT_R = 210;
const DOMAIN_R = 86;
const TOPIC_R = 26;
const SUB_R = 12;

interface GlyphProps {
  node: AtlasNode;
  x: number;
  y: number;
  yearRelevant: boolean;
  mastered: boolean;
  explored: boolean;
  active: boolean;
  /** nodes that are still fading in must not capture taps */
  interactive: boolean;
  onActivate: (id: string) => void;
}

function labelAnchor(angle: number) {
  const cos = Math.cos(angle);
  if (cos > 0.25) return { anchor: "start" as const, dx: 1 };
  if (cos < -0.25) return { anchor: "end" as const, dx: -1 };
  return { anchor: "middle" as const, dx: 0 };
}

function AtlasNodeGlyphBase({
  node,
  x,
  y,
  yearRelevant,
  mastered,
  explored,
  active,
  interactive,
  onActivate,
}: GlyphProps) {
  const handle = () => onActivate(node.id);
  const isPlaceholder = node.status === "placeholder";
  const radius =
    node.depth === 0 ? SUBJECT_R : node.depth === 1 ? DOMAIN_R : node.depth === 2 ? TOPIC_R : SUB_R;

  const parent = node.parentId ? ATLAS.byId[node.parentId] : undefined;
  const label = `${node.title}${parent && node.depth >= 1 ? ` (em ${parent.title})` : ""}${
    isPlaceholder ? " — território em mapeamento" : ""
  }`;
  const common = interactive
    ? {
        className: "atlas-node-body",
        transform: `translate(${x} ${y})`,
        "aria-label": label,
        tabIndex: 0,
        role: "button" as const,
        onClick: handle,
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

  const hit = <circle r={radius * 1.35 + 14} fill="transparent" />;

  const yearHalo = yearRelevant ? (
    <circle
      className="year-pulse"
      r={radius * 1.18}
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.4"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
  ) : null;

  const masteryRing = mastered ? (
    <circle
      r={radius * 0.82}
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.85"
      strokeWidth="1"
      strokeDasharray="3 5"
      vectorEffect="non-scaling-stroke"
    />
  ) : null;

  if (node.depth === 0) {
    return (
      <g {...common}>
        {hit}
        {yearHalo}
        <g className="orbit-slow">
          <circle
            r={SUBJECT_R}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="1.5 9"
            vectorEffect="non-scaling-stroke"
          />
          <circle r="3.4" cy={-SUBJECT_R} fill="#ffffff" fillOpacity="0.85" />
          <circle cx={SUBJECT_R * 0.72} cy={SUBJECT_R * 0.72} r="2.4" fill="#ffffff" fillOpacity="0.5" />
        </g>
        <g className="orbit-rev">
          <circle r={SUBJECT_R * 0.72} fill="none" stroke="#ffffff" strokeOpacity="0.24" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <circle cx={-SUBJECT_R * 0.72} r="2.6" fill="#ffffff" fillOpacity="0.6" />
        </g>
        <circle r={SUBJECT_R * 0.45} fill="none" stroke="#ffffff" strokeOpacity="0.42" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle r={SUBJECT_R * 0.46} fill="#ffffff" fillOpacity="0.03" />
        <circle className="breathe" r={SUBJECT_R * 0.2} fill="#ffffff" fillOpacity="0.09" />
        <circle
          className="atlas-node-core"
          r={active ? 16 : 13}
          fill="#ffffff"
          fillOpacity={active ? 1 : 0.9}
        />
        {masteryRing}
        <text
          className="atlas-label atlas-label-subject"
          y={SUBJECT_R + 56}
          textAnchor="middle"
          fillOpacity={active ? 1 : 0.9}
        >
          {node.title}
        </text>
      </g>
    );
  }

  if (node.depth === 1) {
    return (
      <g {...common}>
        {hit}
        {yearHalo}
        <g className="orbit-med">
          <circle
            r={DOMAIN_R}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={isPlaceholder ? 0.26 : 0.5}
            strokeWidth="1"
            strokeDasharray={isPlaceholder ? "2 15" : "2 9"}
            vectorEffect="non-scaling-stroke"
          />
          <circle r="2.6" cy={-DOMAIN_R} fill="#ffffff" fillOpacity="0.7" />
        </g>
        <circle r={DOMAIN_R * 0.6} fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <circle className="breathe" r={DOMAIN_R * 0.3} fill="#ffffff" fillOpacity="0.1" />
        <circle
          className="atlas-node-core"
          r={active ? 9 : 7}
          fill={isPlaceholder ? "none" : "#ffffff"}
          stroke="#ffffff"
          strokeOpacity={isPlaceholder ? 0.7 : 1}
          vectorEffect="non-scaling-stroke"
        />
        {masteryRing}
        <text
          className="atlas-label atlas-label-domain"
          y={DOMAIN_R + 34}
          textAnchor="middle"
          fillOpacity={active ? 1 : 0.86}
        >
          {node.title}
        </text>
      </g>
    );
  }

  if (node.depth === 2) {
    const { anchor, dx } = labelAnchor(node.angle);
    return (
      <g {...common}>
        {hit}
        {yearHalo}
        <circle
          r={TOPIC_R}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={node.hasConcept ? 0.62 : isPlaceholder ? 0.24 : 0.4}
          strokeWidth="1"
          strokeDasharray={isPlaceholder ? "2 7" : node.hasConcept ? undefined : "4 5"}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="atlas-node-core"
          r={active ? 8 : node.hasConcept ? 6.5 : 5}
          fill={isPlaceholder ? "none" : "#ffffff"}
          stroke="#ffffff"
          strokeOpacity={isPlaceholder ? 0.66 : 1}
          vectorEffect="non-scaling-stroke"
        />
        {explored ? <circle r={TOPIC_R * 0.45} fill="#ffffff" fillOpacity="0.5" /> : null}
        {masteryRing}
        <text
          className="atlas-label atlas-label-concept"
          textAnchor={anchor}
          x={dx * (TOPIC_R + 18)}
          dy="0.34em"
          fillOpacity={active ? 1 : 0.9}
        >
          {node.title}
        </text>
      </g>
    );
  }

  const { anchor, dx } = labelAnchor(node.angle);
  return (
    <g {...common}>
      {hit}
      {yearHalo}
      <circle
        r={SUB_R}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.3"
        strokeWidth="1"
        strokeDasharray="2 5"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="atlas-node-core"
        r={active ? 5 : 3.6}
        fill={isPlaceholder ? "none" : "#ffffff"}
        stroke="#ffffff"
        strokeOpacity={isPlaceholder ? 0.6 : 1}
        vectorEffect="non-scaling-stroke"
      />
      <text
        className="atlas-label atlas-label-sub"
        textAnchor={anchor}
        x={dx * (SUB_R + 12)}
        dy="0.34em"
      >
        {node.title}
      </text>
    </g>
  );
}

export const AtlasNodeGlyph = memo(AtlasNodeGlyphBase);
