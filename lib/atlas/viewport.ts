/**
 * Safe areas. Every camera target is expressed inside the usable rectangle, so
 * nothing is ever framed behind the header, the bottom rail or the detail panel.
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

export const MIN_FIT_SCALE = 0.24;
export const MAX_FIT_SCALE = 0.98;

export function contentRect(viewport: { w: number; h: number }, panelOpen: boolean): Rect {
  const right = panelOpen ? PANEL_WIDTH : 0;
  return {
    x: 0,
    y: 0,
    w: Math.max(280, viewport.w - right),
    h: Math.max(280, viewport.h - BOTTOM_RESERVED),
  };
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** scale that fits `bounds` inside the safe rectangle, with a little air */
export function fitScaleFor(bounds: Bounds, rect: Rect, padding = 0.86): number {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const raw = Math.min((rect.w * padding) / width, (rect.h * padding) / height);
  return Math.min(MAX_FIT_SCALE, Math.max(MIN_FIT_SCALE, raw));
}

export interface CameraTarget {
  x: number;
  y: number;
  scale: number;
}

export function cameraTargetFor(
  point: { x: number; y: number },
  scale: number,
  viewport: { w: number; h: number },
  rect: Rect,
): CameraTarget {
  const centerX = rect.x + rect.w / 2;
  const centerY = rect.y + rect.h / 2;
  return {
    x: point.x - (centerX - viewport.w / 2) / scale,
    y: point.y - (centerY - viewport.h / 2) / scale,
    scale,
  };
}

/** camera that frames the whole composition inside the safe area */
export function cameraForBounds(
  bounds: Bounds,
  viewport: { w: number; h: number },
  rect: Rect,
): CameraTarget {
  const scale = fitScaleFor(bounds, rect);
  return cameraTargetFor(
    { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 },
    scale,
    viewport,
    rect,
  );
}
