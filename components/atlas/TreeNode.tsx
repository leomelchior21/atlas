"use client";

import { memo } from "react";
import { glyphRadius, type TreeNode as TreeNodeModel } from "@/lib/atlas/tree";

interface TreeNodeProps {
  entry: TreeNodeModel;
  yearRelevant: boolean;
  mastered: boolean;
  explored: boolean;
  selected: boolean;
  hovered: boolean;
  interactive: boolean;
  onActivate: (id: string) => void;
  onHover: (id: string | null) => void;
}

function labelGap(depth: number): number {
  if (depth === 0) return 40;
  if (depth === 1) return 30;
  if (depth === 2) return 22;
  if (depth === 3) return 16;
  return 13;
}

function TreeNodeGlyphBase({
  entry,
  yearRelevant,
  mastered,
  explored,
  selected,
  hovered,
  interactive,
  onActivate,
  onHover,
}: TreeNodeProps) {
  const { node, depth, side, expanded, expandable } = entry;
  const radius = glyphRadius(depth);
  const isPlaceholder = node?.status === "placeholder";
  const isConcept = Boolean(node?.hasConcept);

  const label = `${entry.title}${
    expandable ? (expanded ? " — aberto" : " — abrir ramificações") : ""
  }${isPlaceholder ? " — território em mapeamento" : ""}`;

  const common = interactive
    ? {
        className: "atlas-node-body",
        transform: `translate(${entry.x} ${entry.y})`,
        "aria-label": label,
        "aria-expanded": expandable ? expanded : undefined,
        tabIndex: 0,
        role: "button" as const,
        onClick: () => onActivate(entry.id),
        onPointerEnter: () => onHover(entry.id),
        onPointerLeave: () => onHover(null),
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onActivate(entry.id);
          }
        },
      }
    : {
        className: "atlas-node-body",
        transform: `translate(${entry.x} ${entry.y})`,
        "aria-label": label,
        style: { pointerEvents: "none" as const },
      };

  /* the atlas root: the symbol of the whole map */
  if (depth === 0) {
    return (
      <g {...common}>
        <circle r={radius + 22} fill="transparent" />
        <circle className="atlas-focus-ring" r={radius * 1.85} />
        {selected || hovered ? (
          <circle
            r={radius * 1.7}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.4"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <g className="orbit-slow">
          <circle
            r={radius * 1.36}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.32"
            strokeWidth="1"
            strokeDasharray="1.5 9"
            vectorEffect="non-scaling-stroke"
          />
          <circle r="2.6" cy={-radius * 1.36} fill="#ffffff" fillOpacity="0.85" />
        </g>
        <circle
          r={radius * 0.74}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.3"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <circle className="breathe" r={radius} fill="#ffffff" fillOpacity="0.05" />
        <circle r={radius * 0.3} fill="#ffffff" fillOpacity="0.95" />
      </g>
    );
  }

  const ringOpacity = isPlaceholder ? 0.26 : isConcept ? 0.52 : expandable ? 0.42 : 0.3;

  return (
    <g {...common}>
      <circle r={radius + 16} fill="transparent" />
      <circle className="atlas-focus-ring" r={radius * 1.72} />
      {selected || hovered ? (
        <circle
          r={radius * 1.62}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={hovered && !selected ? 0.3 : 0.5}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {yearRelevant && !selected ? (
        <circle
          r={radius * 1.42}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {expanded ? (
        <g className="orbit-med">
          <circle
            r={radius * 1.34}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.26"
            strokeWidth="1"
            strokeDasharray="1.5 8"
            vectorEffect="non-scaling-stroke"
          />
          <circle r="1.8" cy={-radius * 1.34} fill="#ffffff" fillOpacity="0.7" />
        </g>
      ) : null}

      <circle
        r={radius}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={ringOpacity}
        strokeWidth="1"
        strokeDasharray={isPlaceholder ? "2 6" : expandable && !expanded ? "3 5" : undefined}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="atlas-node-core"
        r={selected ? radius * 0.36 : expanded ? radius * 0.3 : radius * 0.24}
        fill={isPlaceholder ? "none" : "#ffffff"}
        stroke="#ffffff"
        strokeOpacity={isPlaceholder ? 0.58 : 1}
        vectorEffect="non-scaling-stroke"
      />
      {explored && !isPlaceholder ? (
        <circle r={radius * 0.55} fill="#ffffff" fillOpacity="0.2" />
      ) : null}
      {mastered ? (
        <circle
          r={radius * 1.1}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="1"
          strokeDasharray="2 5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {expandable && !expanded ? (
        <g transform={`translate(${side === "left" ? -radius * 1.5 : radius * 1.5} 0)`}>
          <circle r="1.6" fill="#ffffff" fillOpacity="0.5" />
        </g>
      ) : null}

      <text
        className={`atlas-label ${
          depth === 1
            ? "atlas-label-domain"
            : depth === 2
              ? "atlas-label-concept"
              : "atlas-label-sub"
        }`}
        x={side === "left" ? -(radius + labelGap(depth)) : radius + labelGap(depth)}
        y={0}
        dy="0.34em"
        textAnchor={side === "left" ? "end" : "start"}
        fillOpacity={selected ? 1 : depth === 1 ? 0.9 : isConcept ? 0.88 : 0.72}
      >
        {entry.title}
      </text>
    </g>
  );
}

export const TreeNodeGlyph = memo(TreeNodeGlyphBase);
