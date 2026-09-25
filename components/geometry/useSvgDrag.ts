"use client";

import type { Point } from "@/lib/geometry";

export function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  if (typeof svg.createSVGPoint === "function") {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();
    if (matrix) {
      const transformed = point.matrixTransform(matrix.inverse());
      return { x: transformed.x, y: transformed.y };
    }
  }
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const scaleX = viewBox.width / Math.max(1, rect.width);
  const scaleY = viewBox.height / Math.max(1, rect.height);
  return {
    x: viewBox.x + (clientX - rect.left) * scaleX,
    y: viewBox.y + (clientY - rect.top) * scaleY,
  };
}

export function beginSvgDrag(
  event: React.PointerEvent,
  onMove: (point: Point) => void,
  onEnd?: () => void,
): void {
  const target = event.currentTarget as SVGElement;
  const svg = target.ownerSVGElement;
  if (!svg) return;
  event.preventDefault();
  event.stopPropagation();

  const handleMove = (native: PointerEvent) => {
    onMove(clientToSvg(svg, native.clientX, native.clientY));
  };
  const handleUp = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
    onEnd?.();
  };
  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleUp);
  window.addEventListener("pointercancel", handleUp);
  handleMove(event.nativeEvent);
}

export function pointerToSvg(svg: SVGSVGElement): (event: React.PointerEvent) => Point {
  return (event) => clientToSvg(svg, event.clientX, event.clientY);
}

/**
 * Keyboard equivalent for the draggable handles. Arrow keys nudge the handle
 * so the interaction is never pointer-only.
 */
export function handleSliderKeys(
  event: React.KeyboardEvent,
  options: { onDelta: (dx: number, dy: number) => void; step?: number; fastStep?: number },
): void {
  const step = options.step ?? 1;
  const fast = options.fastStep ?? step * 5;
  const amount = event.shiftKey ? fast : step;
  const deltas: Record<string, [number, number]> = {
    ArrowLeft: [-amount, 0],
    ArrowRight: [amount, 0],
    ArrowUp: [0, -amount],
    ArrowDown: [0, amount],
  };
  const delta = deltas[event.key];
  if (!delta) return;
  event.preventDefault();
  event.stopPropagation();
  options.onDelta(delta[0], delta[1]);
}
