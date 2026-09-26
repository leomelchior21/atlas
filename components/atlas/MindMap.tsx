"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ATLAS } from "@/content";
import {
  allExpandableIds,
  ATLAS_ROOT_ID,
  ancestorsToExpand,
  layoutTree,
} from "@/lib/atlas/tree";
import { cameraForBounds, cameraTargetFor, contentRect, fitScaleFor } from "@/lib/atlas/viewport";
import { MiniMap } from "./MiniMap";
import { NodePanel } from "./NodePanel";
import { TreeNodeGlyph } from "./TreeNode";
import { ZoomHint } from "./ZoomHint";
import { useCamera } from "./useCamera";
import type { FocusRequest } from "@/store/atlas-store";
import { YEAR_LABELS } from "@/types/content";

interface MindMapProps {
  focus: FocusRequest | null;
  studentYear: number;
  masteryByNode: Record<string, number>;
  explored: string[];
  expanded: string[];
  selectedId: string | null;
  onSelect: (nodeId: string) => void;
  onToggleExpanded: (nodeId: string) => void;
  onSetExpanded: (ids: string[]) => void;
  onClearSelection: () => void;
  onOpen: (nodeId: string) => void;
}

export function MindMap({
  focus,
  studentYear,
  masteryByNode,
  explored,
  expanded,
  selectedId,
  onSelect,
  onToggleExpanded,
  onSetExpanded,
  onClearSelection,
  onOpen,
}: MindMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const initialized = useRef(false);

  const {
    containerRef,
    layerRef,
    cameraRef,
    viewport,
    rect,
    measured,
    hasInteracted,
    flyTo,
    zoomBy,
    centerOnWorld,
    nudge,
  } = useCamera({ x: 0, y: 0, scale: 0.8 }, Boolean(selectedId));

  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const layout = useMemo(() => layoutTree(ATLAS_ROOT_ID, expandedSet), [expandedSet]);
  const exploredSet = useMemo(() => new Set(explored), [explored]);

  const frameAll = useCallback(
    (duration = 640) => {
      const target = cameraForBounds(layout.bounds, viewport, rect);
      flyTo(target.x, target.y, target.scale, duration);
    },
    [layout.bounds, viewport, rect, flyTo],
  );

  /* ------------------------------------------------------------ camera */

  useEffect(() => {
    if (initialized.current || !measured) return;
    initialized.current = true;
    frameAll(0);
  }, [measured, frameAll]);

  const layoutKey = useMemo(
    () => layout.nodes.map((entry) => `${entry.id}:${entry.expanded ? 1 : 0}`).join(","),
    [layout],
  );
  const previousLayout = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized.current) return;
    if (previousLayout.current === null) {
      previousLayout.current = layoutKey;
      return;
    }
    if (previousLayout.current === layoutKey) return;
    previousLayout.current = layoutKey;
    frameAll(620);
  }, [layoutKey, frameAll]);

  useEffect(() => {
    if (!focus) return;
    const entry = layout.byId[focus.nodeId];
    if (!entry) return;
    initialized.current = true;
    const scale = Math.min(fitScaleFor(layout.bounds, rect), 0.92);
    const target = cameraTargetFor({ x: entry.x, y: entry.y }, scale, viewport, rect);
    flyTo(target.x, target.y, target.scale, 700);
  }, [focus, layout, viewport, rect, flyTo]);

  /* --------------------------------------------------------- interaction */

  const activate = (id: string) => {
    if (id === ATLAS_ROOT_ID) return;
    const entry = layout.byId[id];
    if (!entry?.node) return;
    if (entry.expandable) {
      onToggleExpanded(id);
      onSelect(id);
      return;
    }
    onSelect(id);
    if (entry.node.hasConcept || entry.node.status === "placeholder") onOpen(id);
  };

  const visibleNodes = layout.nodes;

  return (
    <div ref={containerRef} className="atlas-surface absolute inset-0 overflow-hidden bg-black">
      <svg
        className="absolute inset-0 h-full w-full"
        shapeRendering="geometricPrecision"
        aria-label="Mapa mental ATLAS"
        role="application"
      >
        <g ref={layerRef}>
          <g fill="none" stroke="#ffffff">
            {layout.edges.map((edge) => (
              <path
                key={edge.id}
                d={edge.d}
                className="atlas-branch"
                style={{ ["--len" as string]: `${edge.length}` }}
                strokeDasharray={edge.length}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeOpacity={
                  edge.toId === selectedId || edge.fromId === selectedId ? 0.42 : 0.2
                }
              />
            ))}
          </g>

          <g>
            {visibleNodes.map((entry) => (
              <TreeNodeGlyph
                key={entry.id}
                entry={entry}
                yearRelevant={
                  Boolean(entry.node?.recommendedYears.includes(studentYear)) &&
                  selectedId !== entry.id &&
                  entry.depth > 0
                }
                mastered={(masteryByNode[entry.id] ?? 0) >= 70}
                explored={exploredSet.has(entry.id)}
                selected={selectedId === entry.id}
                hovered={hoveredId === entry.id}
                interactive={entry.depth > 0}
                onActivate={activate}
                onHover={setHoveredId}
              />
            ))}
          </g>
        </g>
      </svg>

      {visibleNodes.length > 12 ? (
        <MiniMap
          cameraRef={cameraRef}
          viewport={viewport}
          bounds={layout.bounds}
          dots={visibleNodes.map((entry) => ({
            id: entry.id,
            x: entry.x,
            y: entry.y,
            depth: entry.depth,
          }))}
          onNavigate={centerOnWorld}
        />
      ) : null}

      <div
        className="group absolute bottom-[70px] left-2 z-20 flex w-14 flex-col items-center gap-1 py-4 opacity-0 transition-opacity duration-300 focus-within:opacity-100 hover:opacity-100"
        aria-label="Controles do mapa"
      >
        <button
          type="button"
          aria-label="Aproximar"
          onClick={() => zoomBy(1.35)}
          className="flex h-9 w-9 items-center justify-center text-[15px] font-light text-white/55 transition-colors hover:text-white"
        >
          +
        </button>
        <span className="h-4 w-px bg-white/15" aria-hidden="true" />
        <button
          type="button"
          aria-label="Afastar"
          onClick={() => zoomBy(1 / 1.35)}
          className="flex h-9 w-9 items-center justify-center text-[15px] font-light text-white/55 transition-colors hover:text-white"
        >
          −
        </button>
        <span className="my-1 h-px w-5 bg-white/12" aria-hidden="true" />
        <button
          type="button"
          aria-label="Enquadrar o mapa"
          onClick={() => frameAll(520)}
          className="flex h-9 w-9 items-center justify-center text-[12px] text-white/55 transition-colors hover:text-white"
        >
          ⤢
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-6">
        <button
          type="button"
          onClick={() => onSetExpanded(allExpandableIds())}
          className="text-[10px] tracking-[0.24em] text-white/35 transition-colors hover:text-white"
        >
          ABRIR TUDO
        </button>
        <span className="h-3 w-px bg-white/15" aria-hidden="true" />
        <button
          type="button"
          onClick={() => onSetExpanded([ATLAS_ROOT_ID])}
          className="text-[10px] tracking-[0.24em] text-white/35 transition-colors hover:text-white"
        >
          RECOLHER
        </button>
      </div>

      {!hasInteracted && expanded.length <= 1 ? <ZoomHint /> : null}

      <div className="pointer-events-none absolute bottom-6 left-7 z-10">
        <p className="font-display text-[13px] tracking-[0.24em] text-white/80">
          {YEAR_LABELS[studentYear]?.toUpperCase()}
        </p>
        <span className="mt-2.5 block h-px w-12 bg-white/30" />
        <p className="mt-2.5 text-[10px] tracking-[0.22em] text-white/35">ÊNFASE ATUAL</p>
      </div>

      {selectedId ? (
        <NodePanel
          nodeId={selectedId}
          masteryByNode={masteryByNode}
          onSelect={(nodeId) => {
            onSelect(nodeId);
            if (!expandedSet.has(nodeId)) onToggleExpanded(nodeId);
          }}
          onOpen={onOpen}
          onClose={onClearSelection}
        />
      ) : null}
    </div>
  );
}

export { ancestorsToExpand };
