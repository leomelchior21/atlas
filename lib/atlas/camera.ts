export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export const MIN_SCALE = 0.14;
export const MAX_SCALE = 9;

export function clampCamera(camera: Camera, bounds?: { minX: number; maxX: number; minY: number; maxY: number }): Camera {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, camera.scale));
  if (!bounds) return { x: camera.x, y: camera.y, scale };
  const pad = 400;
  return {
    x: Math.min(bounds.maxX + pad, Math.max(bounds.minX - pad, camera.x)),
    y: Math.min(bounds.maxY + pad, Math.max(bounds.minY - pad, camera.y)),
    scale,
  };
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function worldToScreen(
  camera: Camera,
  viewport: { w: number; h: number },
  point: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: (point.x - camera.x) * camera.scale + viewport.w / 2,
    y: (point.y - camera.y) * camera.scale + viewport.h / 2,
  };
}

export function screenToWorld(
  camera: Camera,
  viewport: { w: number; h: number },
  point: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: (point.x - viewport.w / 2) / camera.scale + camera.x,
    y: (point.y - viewport.h / 2) / camera.scale + camera.y,
  };
}

export function fitScale(
  viewport: { w: number; h: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  padding = 0.86,
): number {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  return Math.min((viewport.w * padding) / width, (viewport.h * padding) / height);
}
