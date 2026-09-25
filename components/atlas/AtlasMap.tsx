"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ATLAS } from "@/content";
import { cameraTargetFor, computeLevelScales, focusScaleFor } from "@/lib/atlas/levels";
import { AtlasNodeGlyph } from "./AtlasNodes";
import { MiniMap } from "./MiniMap";
import { NodePanel } from "./NodePanel";
import { ZoomHint } from "./ZoomHint";
import { useCamera } from "./useCamera";
import type { FocusRequest } from "@/store/atlas-store";
import { YEAR_LABELS, type AtlasNode } from "@/types/content";

interface AtlasMapProps {
  focus: FocusRequest | null;
  studentYear: number;
  masteryByNode: Record<string, number>;
  explored: string[];
  selectedId: string | null;
  onSelect: (nodeId: string) => void;
  onClearSelection: () => void;
  onOpen: (nodeId: string) => void;
}

const GRID_STEP = 780;

export function AtlasMap({
  focus,
  studentYear,
  masteryByNode,
  explored,
  selectedId,
  onSelect,
  onClearSelection,
  onOpen,
}: AtlasMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const initialized = useRef(false);

  const {
    containerRef,
    layerRef,
    cameraRef,
    viewport,
    semantics,
    rect,
    measured,
    hasInteracted,
    flyTo,
    zoomBy,
    centerOnWorld,
    isMoving,
  } = useCamera({ x: 0, y: 0, scale: 0.3 }, Boolean(selectedId));

  const { tier, centerId } = semantics;
  const center = ATLAS.byId[centerId];
  /** derived from the measured safe area, so it is never a stale snapshot */
  const scales = useMemo(() => computeLevelScales(rect), [rect]);

  /* ------------------------------------------------------------ camera */

  useEffect(() => {
    if (initialized.current) return;
    if (focus || selectedId) {
      initialized.current = true;
      return;
    }
    if (!measured) return; // wait for the first real measurement
    initialized.current = true;
    const target = cameraTargetFor(ATLAS.byId["math-root"]!, scales.fit[0], viewport, rect);
    flyTo(target.x, target.y, target.scale, 0);
  }, [viewport, rect, scales, flyTo, selectedId, focus, measured]);

  useEffect(() => {
    if (!focus) return;
    const node = ATLAS.byId[focus.nodeId];
    if (!node) return;
    initialized.current = true;
    const target = cameraTargetFor(node, focusScaleFor(node, scales), viewport, rect);
    flyTo(target.x, target.y, target.scale, 760);
  }, [focus, scales, viewport, rect, flyTo]);

  /**
   * The panel only ever opens together with a selection, and the focus request
   * already targets the shrunken safe area — so no extra shift is applied here.
   */

  /* --------------------------------------------------------- composition */

  const { nodes, edges } = useMemo(() => {
    const ids = new Set<string>();
    const parents = new Map<string, string>();
    const add = (id: string) => {
      if (!ids.has(id) && ATLAS.byId[id]) ids.add(id);
    };

    add(centerId);
    for (const child of ATLAS.childrenOf[centerId] ?? []) add(child.id);

    if (center?.parentId) {
      parents.set(centerId, center.parentId);
      add(center.parentId);
      for (const sibling of ATLAS.childrenOf[center.parentId] ?? []) add(sibling.id);
    }

    if (tier <= 1) {
      for (const subject of ATLAS.subjects) add(subject.id);
    }

    const list: AtlasNode[] = [];
    for (const node of ATLAS.nodes) if (ids.has(node.id)) list.push(node);

    /* connections: only the current level, never the whole graph */
    const depthOf = (id: string) => ATLAS.byId[id]?.depth ?? 0;
    const links: Array<{ id: string; d: string; opacity: number; route: boolean }> = [];
    const addLink = (
      fromId: string,
      toId: string,
      opacity: number,
      route: boolean,
    ) => {
      const a = ATLAS.world[fromId];
      const b = ATLAS.world[toId];
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const bow = Math.min(120, length * 0.14) * (route ? 1 : -1);
      const cx = mid.x + (-dy / length) * bow;
      const cy = mid.y + (dx / length) * bow;
      links.push({
        id: `${fromId}~${toId}`,
        d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`,
        opacity,
        route,
      });
    };

    for (const node of list) {
      if (node.id === centerId) continue;
      if (node.parentId === centerId && depthOf(node.id) === tier) {
        addLink(centerId, node.id, node.id === selectedId ? 0.5 : 0.18, false);
      }
    }
    if (center?.parentId && depthOf(center.parentId) < tier) {
      addLink(center.parentId, centerId, selectedId === centerId ? 0.7 : 0.16, true);
    }
    for (const node of list) {
      if (depthOf(node.id) !== tier) continue;
      for (const target of node.connections) {
        if (!ids.has(target) || depthOf(target) !== tier) continue;
        addLink(node.id, target, 0.14, false);
      }
    }

    return { nodes: list, edges: links };
  }, [centerId, center, tier, selectedId]);

  const opacityClass = (node: AtlasNode): string => {
    if (node.id === centerId) return "";
    if (node.depth < tier) return "atlas-out";
    if (node.depth === tier) {
      if (selectedId && node.id !== selectedId && node.parentId !== selectedId) {
        return `atlas-fade-${tier} atlas-dim-sibling`;
      }
      return `atlas-fade-${tier}`;
    }
    return `atlas-fade-${node.depth}`;
  };

  const interactive = (node: AtlasNode): boolean =>
    node.id === centerId || node.depth === tier;

  const gridLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const { minX, maxX, minY, maxY } = ATLAS.bounds;
    for (let x = Math.floor(minX / GRID_STEP) * GRID_STEP; x <= maxX; x += GRID_STEP) {
      lines.push({ x1: x, y1: minY, x2: x, y2: maxY });
    }
    for (let y = Math.floor(minY / GRID_STEP) * GRID_STEP; y <= maxY; y += GRID_STEP) {
      lines.push({ x1: minX, y1: y, x2: maxX, y2: y });
    }
    return lines;
  }, []);

  const exploredSet = useMemo(() => new Set(explored), [explored]);
  const highlightedId = hoveredId ?? selectedId;

  return (
    <div ref={containerRef} className="atlas-surface absolute inset-0 overflow-hidden bg-black">
      <svg
        className="absolute inset-0 h-full w-full"
        shapeRendering="geometricPrecision"
        aria-label="Mapa de conhecimento ATLAS"
        role="application"
      >
        <g ref={layerRef}>
          <g stroke="#ffffff" strokeOpacity="0.022" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {gridLines.map((line, index) => (
              <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
            ))}
          </g>

          <g fill="none" stroke="#ffffff">
            {edges.map((edge) => (
              <path
                key={edge.id}
                d={edge.d}
                className={`atlas-node atlas-fade-${tier}`}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeOpacity={edge.opacity}
                strokeDasharray={edge.route ? "3 7" : undefined}
              />
            ))}
          </g>

          <g>
            {nodes.map((node) => {
              const point = ATLAS.world[node.id];
              if (!point) return null;
              return (
                <g key={node.id} className={`atlas-node ${opacityClass(node)}`}>
                  <AtlasNodeGlyph
                    node={node}
                    x={point.x}
                    y={point.y}
                    yearRelevant={
                      node.recommendedYears.includes(studentYear) && selectedId !== node.id
                    }
                    mastered={(masteryByNode[node.id] ?? 0) >= 70}
                    explored={exploredSet.has(node.id)}
                    selected={selectedId === node.id || highlightedId === node.id}
                    interactive={interactive(node)}
                    onActivate={onSelect}
                    onHover={setHoveredId}
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {tier >= 2 ? (
        <MiniMap
          cameraRef={cameraRef}
          viewport={viewport}
          focusSubjectId={semantics.subjectId}
          onNavigate={centerOnWorld}
        />
      ) : null}

      <ZoomControls onZoom={(factor) => zoomBy(factor)} />

      {tier === 0 && !hasInteracted ? <ZoomHint /> : null}

      <YearIndicator studentYear={studentYear} tier={tier} />

      {selectedId ? (
        <NodePanel
          nodeId={selectedId}
          masteryByNode={masteryByNode}
          onSelect={onSelect}
          onOpen={onOpen}
          onClose={onClearSelection}
        />
      ) : null}
    </div>
  );
}

function ZoomControls({ onZoom }: { onZoom: (factor: number) => void }) {
  return (
    <div
      className="group absolute bottom-[72px] left-2 z-20 flex w-14 flex-col items-center gap-1 py-5 opacity-0 transition-opacity duration-300 focus-within:opacity-100 hover:opacity-100"
      aria-label="Controles de zoom"
    >
      <button
        type="button"
        aria-label="Aproximar"
        onClick={() => onZoom(1.42)}
        className="flex h-9 w-9 items-center justify-center text-[15px] font-light text-white/55 transition-colors hover:text-white"
      >
        +
      </button>
      <span className="h-4 w-px bg-white/15" aria-hidden="true" />
      <button
        type="button"
        aria-label="Afastar"
        onClick={() => onZoom(1 / 1.42)}
        className="flex h-9 w-9 items-center justify-center text-[15px] font-light text-white/55 transition-colors hover:text-white"
      >
        −
      </button>
    </div>
  );
}

function YearIndicator({ studentYear, tier }: { studentYear: number; tier: number }) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-7 z-10">
      <p className="font-display text-[13px] tracking-[0.24em] text-white/80">
        {YEAR_LABELS[studentYear]?.toUpperCase()}
      </p>
      <span className="mt-2.5 block h-px w-12 bg-white/30" />
      <p className="mt-2.5 text-[10px] tracking-[0.22em] text-white/35">
        {tier === 0 ? "ÊNFASE ATUAL" : "FOCO ATUAL"}
      </p>
    </div>
  );
}
