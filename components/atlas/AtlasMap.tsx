"use client";

import { useEffect, useMemo, useRef } from "react";
import { ATLAS } from "@/content";
import { fitScale } from "@/lib/atlas/camera";
import { AtlasNodeGlyph } from "./AtlasNodes";
import { MiniMap } from "./MiniMap";
import { ZoomHint } from "./ZoomHint";
import { useCamera } from "./useCamera";
import type { FocusRequest } from "@/store/atlas-store";
import { YEAR_LABELS, type AtlasNode } from "@/types/content";

interface AtlasMapProps {
  focus: FocusRequest | null;
  studentYear: number;
  masteryByNode: Record<string, number>;
  explored: string[];
  onActivate: (nodeId: string) => void;
  onOpenConcept: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  selectedId: string | null;
}

const GRID_STEP = 520;
const MASTERED_THRESHOLD = 70;

export function AtlasMap({
  focus,
  studentYear,
  masteryByNode,
  explored,
  onActivate,
  onOpenConcept,
  onSelect,
  selectedId,
}: AtlasMapProps) {
  const {
    containerRef,
    layerRef,
    cameraRef,
    viewport,
    semantics,
    hasInteracted,
    flyTo,
    zoomBy,
    centerOnWorld,
    isMoving,
  } = useCamera({ x: 0, y: 0, scale: 0.3 });

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || viewport.w < 400) return;
    initialized.current = true;
    flyTo(0, 0, fitScale(viewport, ATLAS.bounds, 0.92), 0);
  }, [viewport, flyTo]);

  useEffect(() => {
    if (!focus) return;
    const point = ATLAS.world[focus.nodeId];
    if (!point) return;
    flyTo(point.x, point.y, focus.scale, 720);
  }, [focus, flyTo]);

  const exploredSet = useMemo(() => new Set(explored), [explored]);

  const subjectKind = ATLAS.byId[semantics.subjectId]?.subject ?? "math";

  const { rendered, externals } = useMemo(() => {
    const ids = new Set<string>();
    const external = new Set<string>();
    const subjectId = semantics.subjectId;
    for (const node of ATLAS.nodes) {
      if (node.depth === 0) {
        ids.add(node.id);
        continue;
      }
      if (node.depth === 1) {
        if (node.parentId === subjectId) ids.add(node.id);
        continue;
      }
      if (node.depth === 2) {
        if (node.parentId === semantics.domainId) ids.add(node.id);
        continue;
      }
      if (node.parentId === semantics.topicId) ids.add(node.id);
    }
    for (const id of ids) {
      const node = ATLAS.byId[id];
      if (!node) continue;
      for (const target of node.connections) {
        const other = ATLAS.byId[target];
        if (!other) continue;
        if (other.subject !== subjectKind) external.add(target);
      }
    }
    return { rendered: ids, externals: external };
  }, [semantics.key, semantics.subjectId, semantics.domainId, semantics.topicId, subjectKind]);

  const nodes = useMemo(() => {
    const list: AtlasNode[] = [];
    for (const node of ATLAS.nodes) {
      if (rendered.has(node.id) || externals.has(node.id)) list.push(node);
    }
    return list;
  }, [rendered, externals]);

  const gridLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const { minX, maxX, minY, maxY } = ATLAS.bounds;
    const startX = Math.floor(minX / GRID_STEP) * GRID_STEP;
    const startY = Math.floor(minY / GRID_STEP) * GRID_STEP;
    for (let x = startX; x <= maxX; x += GRID_STEP) {
      lines.push({ x1: x, y1: minY, x2: x, y2: maxY });
    }
    for (let y = startY; y <= maxY; y += GRID_STEP) {
      lines.push({ x1: minX, y1: y, x2: maxX, y2: y });
    }
    return lines;
  }, []);

  const edges = useMemo(() => {
    const list: Array<{ id: string; d: string; dotted: boolean; depth: number; external: boolean }> = [];
    const available = new Set([...rendered, ...externals]);
    for (const node of ATLAS.nodes) {
      if (!available.has(node.id)) continue;
      if (node.parentId && available.has(node.parentId)) {
        const a = ATLAS.world[node.parentId];
        const b = ATLAS.world[node.id];
        if (a && b) {
          list.push({
            id: `t:${node.id}`,
            d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`,
            dotted: node.status === "placeholder",
            depth: node.depth,
            external: externals.has(node.id),
          });
        }
      }
      for (const target of node.connections) {
        if (!available.has(target) || !rendered.has(node.id)) continue;
        const a = ATLAS.world[node.id];
        const b = ATLAS.world[target];
        if (!a || !b) continue;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const bow = Math.min(220, len * 0.16);
        const cx = mid.x + (-dy / len) * bow;
        const cy = mid.y + (dx / len) * bow;
        list.push({
          id: `c:${node.id}:${target}`,
          d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`,
          dotted: ATLAS.byId[target]?.status === "placeholder",
          depth: Math.max(node.depth, ATLAS.byId[target]?.depth ?? 2),
          external: ATLAS.byId[target]?.subject !== subjectKind,
        });
      }
    }
    return list;
  }, [rendered, externals, subjectKind]);

  const fadeClass = (depth: number): string =>
    depth === 0
      ? ""
      : depth === 1
        ? "atlas-fade-1"
        : depth === 2
          ? "atlas-fade-2"
          : "atlas-fade-3";

  /** inverted layer so opacity multiplies with the semantic fade */
  const innerOpacity = (node: AtlasNode, external: boolean): string => {
    const classes: string[] = [];
    if (external) classes.push("atlas-dim-external");
    if (semantics.tier > 0 && node.depth === 0 && node.id !== semantics.subjectId) {
      classes.push("atlas-dim-branch");
    }
    return classes.join(" ");
  };

  const focusedNode = useMemo(() => {
    const id =
      semantics.tier >= 2 && semantics.topicId
        ? semantics.topicId
        : semantics.tier >= 1 && semantics.domainId
          ? semantics.domainId
          : semantics.subjectId;
    return ATLAS.byId[id];
  }, [semantics.tier, semantics.topicId, semantics.domainId, semantics.subjectId]);

  const targetForConcept = useMemo(() => {
    if (!focusedNode || semantics.tier < 2) return null;
    if (focusedNode.hasConcept) return focusedNode;
    const children = ATLAS.childrenOf[focusedNode.id] ?? [];
    return children.find((child) => child.hasConcept) ?? null;
  }, [focusedNode, semantics.tier]);

  return (
    <div
      ref={containerRef}
      className="atlas-surface absolute inset-0 overflow-hidden"
      style={{ background: "#000" }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        shapeRendering="geometricPrecision"
        aria-label="Mapa de conhecimento ATLAS"
        role="application"
      >
        <defs>
          <filter id="atlas-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <g ref={layerRef}>
          <g stroke="#ffffff" strokeOpacity="0.045" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {gridLines.map((line, index) => (
              <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
            ))}
          </g>

          <g fill="none" stroke="#ffffff">
            {edges.map((edge) => (
              <path
                key={edge.id}
                d={edge.d}
                className={fadeClass(edge.depth)}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeOpacity={
                  edge.external ? 0.22 : edge.dotted ? 0.2 : edge.depth >= 3 ? 0.34 : 0.42
                }
                strokeDasharray={edge.dotted ? "2 6" : undefined}
              />
            ))}
          </g>

          <g>
            {nodes.map((node) => {
              const point = ATLAS.world[node.id];
              if (!point) return null;
              const external = externals.has(node.id);
              return (
                <g
                  key={node.id}
                  className={fadeClass(node.depth)}
                >
                  <g className={innerOpacity(node, external)}>
                    <AtlasNodeGlyph
                      node={node}
                      x={point.x}
                      y={point.y}
                      yearRelevant={node.recommendedYears.includes(studentYear)}
                      mastered={(masteryByNode[node.id] ?? 0) >= MASTERED_THRESHOLD}
                      explored={exploredSet.has(node.id)}
                      active={
                        selectedId === node.id ||
                        (!external &&
                          (focusedNode?.id === node.id || semantics.topicId === node.id))
                      }
                      interactive={
                        !external && (node.depth === 0 || semantics.tier >= node.depth)
                      }
                      onActivate={(id) => {
                        onSelect(id);
                        onActivate(id);
                      }}
                    />
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <MiniMap
        cameraRef={cameraRef}
        viewport={viewport}
        focusSubjectId={semantics.tier >= 1 ? semantics.subjectId : null}
        onNavigate={centerOnWorld}
      />

      <ZoomControls onZoom={(factor) => zoomBy(factor)} />

      {semantics.tier === 0 && !hasInteracted ? <ZoomHint /> : null}

      <YearIndicator studentYear={studentYear} tier={semantics.tier} />

      {focusedNode && semantics.tier >= 1 ? (
        <ContextPanel
          node={focusedNode}
          domainId={semantics.domainId}
          masteryByNode={masteryByNode}
          onActivate={onActivate}
          isMoving={isMoving}
        />
      ) : null}

      {targetForConcept && semantics.tier >= 2 ? (
        <button
          type="button"
          onClick={() => onOpenConcept(targetForConcept.id)}
          className="btn rise-in absolute bottom-6 right-7 z-20 bg-black/40 backdrop-blur-[2px]"
        >
          ABRIR CONCEITO
          <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </div>
  );
}

function ZoomControls({ onZoom }: { onZoom: (factor: number) => void }) {
  return (
    <div className="pointer-events-auto absolute bottom-[132px] left-7 z-20 flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label="Aproximar"
        onClick={() => onZoom(1.42)}
        className="flex h-9 w-9 items-center justify-center text-[15px] font-light text-white/60 transition-colors hover:text-white"
      >
        +
      </button>
      <span className="h-5 w-px bg-white/15" aria-hidden="true" />
      <button
        type="button"
        aria-label="Afastar"
        onClick={() => onZoom(1 / 1.42)}
        className="flex h-9 w-9 items-center justify-center text-[15px] font-light text-white/60 transition-colors hover:text-white"
      >
        −
      </button>
    </div>
  );
}

function YearIndicator({ studentYear, tier }: { studentYear: number; tier: number }) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-7 z-10">
      <p className="micro-b text-white/40">{YEAR_LABELS[studentYear]?.toUpperCase()}</p>
      <span className="mt-2 block h-px w-14 bg-white/25" />
      {tier === 0 ? (
        <p className="mt-3 text-[10px] tracking-[0.16em] text-white/25">
          ênfase no que importa agora — tudo continua explorável
        </p>
      ) : null}
    </div>
  );
}

interface ContextPanelProps {
  node: AtlasNode;
  domainId: string | null;
  masteryByNode: Record<string, number>;
  onActivate: (nodeId: string) => void;
  isMoving: boolean;
}

function ContextPanel({ node, domainId, masteryByNode, onActivate, isMoving }: ContextPanelProps) {
  const panelNode = node.depth === 0 ? ATLAS.byId[domainId ?? node.id] ?? node : node;
  const children = panelNode ? ATLAS.childrenOf[panelNode.id] ?? [] : [];
  const subject = ATLAS.byId[panelNode.subject === "math" ? "math-root" : panelNode.subject === "physics" ? "physics-root" : "chemistry-root"];

  return (
    <aside
      className={`pointer-events-auto absolute right-7 top-1/2 z-20 w-[248px] -translate-y-1/2 transition-opacity duration-500 ${
        isMoving ? "opacity-50" : "opacity-100"
      }`}
      aria-label="Território em foco"
    >
      <p className="micro mb-4">
        {subject?.title ?? ""} <span className="text-white/25">›</span>{" "}
        {panelNode.depth >= 1 ? (ATLAS.byId[panelNode.parentId ?? ""]?.shortTitle ?? "") : ""}
      </p>
      <h2 className="font-display text-[19px] font-light tracking-[0.14em] text-white uppercase">
        {panelNode.depth <= 1 ? panelNode.title : panelNode.title}
      </h2>
      <span className="mt-5 mb-4 block h-px w-full bg-white/12" />
      <ul className="flex flex-col gap-[7px]">
        {children.slice(0, 12).map((child) => {
          const mastery = masteryByNode[child.id] ?? 0;
          return (
            <li key={child.id}>
              <button
                type="button"
                onClick={() => onActivate(child.id)}
                className="group flex w-full items-center gap-2.5 py-[3px] text-left"
              >
                <span
                  aria-hidden="true"
                  className={`h-[7px] w-[7px] shrink-0 rounded-full border transition-colors ${
                    child.hasConcept
                      ? mastery >= 70
                        ? "border-white bg-white"
                        : "border-white bg-white/25"
                      : child.status === "placeholder"
                        ? "border-white/40 group-hover:border-white"
                        : "border-white/70"
                  }`}
                />
                <span
                  className={`truncate text-[11.5px] tracking-[0.04em] transition-colors ${
                    child.hasConcept ? "text-white" : "text-white/60 group-hover:text-white"
                  }`}
                >
                  {child.title}
                </span>
                {mastery > 0 ? (
                  <span className="ml-auto shrink-0 text-[9px] tracking-[0.1em] text-white/35">
                    {Math.round(mastery)}%
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
