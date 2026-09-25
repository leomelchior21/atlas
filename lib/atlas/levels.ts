import { levelRadius } from "@/content/layout";
import { ATLAS } from "@/content";
import type { AtlasNode } from "@/types/content";
import type { Camera } from "./camera";

/**
 * Semantic levels.
 *
 * 0 — overview ......... the three islands
 * 1 — subject .......... Mathematics and its eight territories
 * 2 — domain ........... Geometry and its concepts
 * 3 — concept .......... Triangles and its branches
 *
 * Every level has a curated composition with its own world radius. The camera
 * fit for a level always lands inside that level's zoom band, so crossing the
 * threshold and using the automatic fit are always consistent.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const HEADER_HEIGHT = 72;
export const BOTTOM_RESERVED = 64;
export const PANEL_WIDTH = 332;

export const FIT_PADDING = 0.88;
/** a level becomes active slightly before its comfortable fit */
const BAND = 0.8;

export function contentRect(viewport: { w: number; h: number }, panelOpen: boolean): Rect {
  const right = panelOpen ? PANEL_WIDTH : 0;
  return {
    x: 0,
    y: 0,
    w: Math.max(320, viewport.w - right),
    h: Math.max(320, viewport.h - BOTTOM_RESERVED),
  };
}

export function fitScaleFor(level: 0 | 1 | 2 | 3, rect: Rect): number {
  const radius = levelRadius(level);
  return Math.min(
    (rect.w * FIT_PADDING) / (radius.x * 2),
    (rect.h * FIT_PADDING) / (radius.y * 2),
  );
}

export interface LevelScales {
  fit: [number, number, number, number];
  thresholds: [number, number, number];
}

export function computeLevelScales(rect: Rect): LevelScales {
  const fit0 = fitScaleFor(0, rect);
  const fit1 = fitScaleFor(1, rect);
  const fit2 = fitScaleFor(2, rect);
  const fit3 = fitScaleFor(3, rect);
  return {
    fit: [fit0, fit1, fit2, fit3],
    thresholds: [fit1 * BAND, fit2 * BAND, fit3 * BAND],
  };
}

export function scaleTier(scale: number, thresholds: [number, number, number]): number {
  if (scale < thresholds[0]) return 0;
  if (scale < thresholds[1]) return 1;
  if (scale < thresholds[2]) return 2;
  return 3;
}

/** the semantic level a node belongs to when it becomes the center of the view */
export function levelOfNode(node: AtlasNode): 0 | 1 | 2 | 3 {
  return node.depth;
}

/** scale used when a node becomes the center of the view */
export function focusScaleFor(node: AtlasNode, scales: LevelScales): number {
  const level = levelOfNode(node);
  if (level === 0) return scales.fit[1];
  if (level === 1) return scales.fit[2];
  return scales.fit[3];
}

/** camera target that centers `node` inside the safe content rectangle */
export function cameraTargetFor(
  node: AtlasNode,
  scale: number,
  viewport: { w: number; h: number },
  rect: Rect,
): { x: number; y: number; scale: number } {
  const world = ATLAS.world[node.id] ?? { x: 0, y: 0 };
  const centerX = rect.x + rect.w / 2;
  const centerY = rect.y + rect.h / 2;
  return {
    x: world.x - (centerX - viewport.w / 2) / scale,
    y: world.y - (centerY - viewport.h / 2) / scale,
    scale,
  };
}

export function cameraForLevel(
  level: 0 | 1 | 2 | 3,
  scales: LevelScales,
  viewport: { w: number; h: number },
  rect: Rect,
): Camera {
  const node = centerNodeOfLevel(level);
  const scale = scales.fit[level === 0 ? 0 : level];
  if (!node) return { x: 0, y: 0, scale };
  return cameraTargetFor(node, scale, viewport, rect);
}

function centerNodeOfLevel(level: 0 | 1 | 2 | 3): AtlasNode | undefined {
  if (level === 0) return ATLAS.byId["math-root"];
  if (level === 1) return ATLAS.byId["math-root"];
  if (level === 2) return ATLAS.byId["geo"];
  return ATLAS.byId["geo-triangles"];
}
