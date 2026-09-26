import { ATLAS } from "@/content";
import { hashString } from "@/content/layout";
import type { AtlasNode } from "@/types/content";
import type { Bounds } from "./viewport";

/**
 * Radial mind map layout.
 *
 * Deterministic, no physics: every node owns a direction (angle from the root)
 * and a cone. Opening a node only re-arranges its own cone, so siblings never
 * jump. The tree grows outward; the camera frames it.
 */

/** the atlas itself is the root of the mind map, without being a content node */
export const ATLAS_ROOT_ID = "__atlas";

export interface TreeNode {
  /** null for the virtual atlas root */
  node: AtlasNode | null;
  id: string;
  title: string;
  depth: number;
  angle: number;
  radius: number;
  x: number;
  y: number;
  /** left half uses end-anchored labels, right half start-anchored */
  side: "left" | "right" | "center";
  expanded: boolean;
  expandable: boolean;
  children: number;
}

export interface TreeEdge {
  id: string;
  fromId: string;
  toId: string;
  d: string;
  depth: number;
  /** used by the draw-in animation */
  length: number;
}

export interface TreeLayout {
  nodes: TreeNode[];
  byId: Record<string, TreeNode>;
  edges: TreeEdge[];
  bounds: Bounds;
}

const RADIUS_STEP: Record<number, number> = {
  0: 300,
  1: 232,
  2: 210,
  3: 196,
  4: 184,
};

/** minimum arc distance between two neighbouring labels */
const MIN_ARC = 58;
const MAX_CONE = 2.16; // ~124°
const CONE_SHRINK = 0.66;
const MIN_CONE = 0.52; // ~30°

function radiusStep(depth: number): number {
  return RADIUS_STEP[Math.min(4, depth)] ?? 180;
}

/**
 * Children are ordered using the curated composition from the old atlas, so
 * Matemática keeps Geometria on the right and Números at the top, etc.
 */
function childrenFor(parentId: string): AtlasNode[] {
  if (parentId === ATLAS_ROOT_ID) return ATLAS.subjects;
  return ATLAS.childrenOf[parentId] ?? [];
}

function orderedChildren(parentId: string): AtlasNode[] {
  const children = [...childrenFor(parentId)];
  if (children.length < 2) return children;
  const seed = hashString(parentId);
  return children
    .map((child, index) => {
      const angle = child.angle + (Number.isFinite(child.angle) ? 0 : 0);
      const jitter = (hashString(`${child.id}:order`) - 0.5) * 0.12;
      return { child, key: angle + jitter + seed * 0.001 * index };
    })
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.child);
}

export function layoutTree(rootId: string, expanded: ReadonlySet<string>): TreeLayout {
  const nodes: TreeNode[] = [];
  const byId: Record<string, TreeNode> = {};
  const edges: TreeEdge[] = [];

  const root = rootId === ATLAS_ROOT_ID ? null : ATLAS.byId[rootId];
  if (rootId !== ATLAS_ROOT_ID && !root) {
    return {
      nodes,
      byId,
      edges,
      bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
    };
  }

  const place = (
    node: AtlasNode | null,
    depth: number,
    angle: number,
    radius: number,
    cone: number,
    parent?: TreeNode,
  ) => {
    const id = node?.id ?? ATLAS_ROOT_ID;
    const point =
      depth === 0
        ? { x: 0, y: 0 }
        : { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    const children = orderedChildren(id);
    const isExpanded = depth === 0 ? true : expanded.has(id);
    const entry: TreeNode = {
      node,
      id,
      title: node?.title ?? "ATLAS",
      depth,
      angle: depth === 0 ? 0 : angle,
      radius,
      x: point.x,
      y: point.y,
      side: depth === 0 ? "center" : Math.cos(angle) >= 0 ? "right" : "left",
      expanded: isExpanded && children.length > 0,
      expandable: children.length > 0,
      children: children.length,
    };
    nodes.push(entry);
    byId[id] = entry;

    if (parent) {
      const start = { x: parent.x, y: parent.y };
      const end = { x: point.x, y: point.y };
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const bow = Math.min(46, length * 0.14);
      const cx = mid.x + (-dy / length) * bow;
      const cy = mid.y + (dx / length) * bow;
      edges.push({
        id: `${parent.id}->${entry.id}`,
        fromId: parent.id,
        toId: entry.id,
        d: `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`,
        depth,
        length: Math.round(length * 1.06),
      });
    }

    if (!entry.expanded) return;

    const count = children.length;
    const spread = Math.max(MIN_CONE, Math.min(cone, Math.PI * 2));
    const needed = (count * MIN_ARC) / Math.max(MIN_CONE, spread);
    const step = Math.max(radiusStep(depth + 1), needed);
    const childRadius = depth === 0 ? step : radius + step;
    const childCone = Math.max(MIN_CONE, Math.min(MAX_CONE, spread * CONE_SHRINK));
    const first = angle - spread / 2 + spread / (count * 2);
    for (let index = 0; index < count; index++) {
      const childAngle = depth === 0 ? (index / count) * Math.PI * 2 - Math.PI / 2 : first + (spread / count) * index;
      place(children[index], depth + 1, childAngle, childRadius, childCone, entry);
    }
  };

  place(root, 0, 0, 0, Math.PI * 2);

  const pad = 150;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const entry of nodes) {
    const glyph = glyphRadius(entry.depth) + (entry.expanded ? glyphRadius(entry.depth) : 0);
    minX = Math.min(minX, entry.x - glyph - pad * 0.42);
    maxX = Math.max(maxX, entry.x + glyph + pad * 0.42);
    minY = Math.min(minY, entry.y - glyph - pad * 0.42);
    maxY = Math.max(maxY, entry.y + glyph + pad * 0.42);
  }

  return { nodes, byId, edges, bounds: { minX, maxX, minY, maxY } };
}

export function glyphRadius(depth: number): number {
  if (depth === 0) return 46;
  if (depth === 1) return 34;
  if (depth === 2) return 25;
  if (depth === 3) return 17;
  return 12;
}

/** the chain of ancestors that must be open for `nodeId` to be visible */
export function ancestorsToExpand(nodeId: string): string[] {
  const out: string[] = [ATLAS_ROOT_ID];
  let current = ATLAS.byId[nodeId];
  while (current?.parentId) {
    out.unshift(current.parentId);
    current = ATLAS.byId[current.parentId];
  }
  return out;
}

/** every node that has children, so "abrir tudo" is a single set operation */
export function allExpandableIds(): string[] {
  const out: string[] = [ATLAS_ROOT_ID];
  const walk = (id: string) => {
    const children = childrenFor(id);
    if (id !== ATLAS_ROOT_ID && children.length) out.push(id);
    for (const child of children) walk(child.id);
  };
  walk(ATLAS_ROOT_ID);
  return out;
}

export function visibleIds(layout: TreeLayout): string[] {
  return layout.nodes.map((entry) => entry.id);
}
