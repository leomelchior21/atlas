"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clampCamera,
  easeInOutCubic,
  MAX_SCALE,
  MIN_SCALE,
  screenToWorld,
  type Camera,
} from "@/lib/atlas/camera";
import { computeSemantics, type SemanticState } from "@/lib/atlas/semantics";

interface PointerState {
  id: number;
  x: number;
  y: number;
}

export interface UseCameraResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  layerRef: React.RefObject<SVGGElement | null>;
  cameraRef: React.MutableRefObject<Camera>;
  viewport: { w: number; h: number };
  semantics: SemanticState;
  hasInteracted: boolean;
  isMoving: boolean;
  flyTo: (x: number, y: number, scale: number, duration?: number) => void;
  zoomBy: (factor: number, anchor?: { x: number; y: number }) => void;
  centerOnWorld: (x: number, y: number) => void;
  nudge: (dxScreen: number, dyScreen: number) => void;
}

const BOUNDS_PAD = 2400;
const TAP_SLOP = 9;
const DOUBLE_TAP_MS = 330;

export function useCamera(initial: Camera): UseCameraResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<SVGGElement | null>(null);
  const cameraRef = useRef<Camera>({ ...initial });
  const [viewport, setViewport] = useState({ w: 1366, h: 768 });
  const [semantics, setSemantics] = useState<SemanticState>(() =>
    computeSemantics(initial, null),
  );
  const semanticsRef = useRef<SemanticState>(semantics);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const animationRef = useRef<{ from: Camera; to: Camera; start: number; duration: number } | null>(
    null,
  );
  const velocityRef = useRef({ x: 0, y: 0 });
  const pointersRef = useRef<Map<number, PointerState>>(new Map());
  const pinchRef = useRef<{
    distance: number;
    scale: number;
    mid: { x: number; y: number };
    camera: Camera;
  } | null>(null);
  const dragRef = useRef<{ x: number; y: number; camera: Camera } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastMoveRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const frameRef = useRef(0);
  const scheduleRef = useRef(false);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const write = useCallback(() => {
    const camera = cameraRef.current;
    const { w, h } = viewportRef.current;
    const layer = layerRef.current;
    const container = containerRef.current;
    if (layer) {
      layer.setAttribute(
        "transform",
        `translate(${w / 2} ${h / 2}) scale(${camera.scale}) translate(${-camera.x} ${-camera.y})`,
      );
    }
    if (container) {
      container.style.setProperty("--s", String(camera.scale));
      container.style.setProperty("--inv", String(1 / camera.scale));
    }
    const next = computeSemantics(camera, semanticsRef.current);
    if (next.key !== semanticsRef.current.key) {
      semanticsRef.current = next;
      setSemantics(next);
    }
  }, []);

  const applyCamera = useCallback(
    (camera: Camera) => {
      cameraRef.current = clampCamera(camera, {
        minX: -BOUNDS_PAD,
        maxX: BOUNDS_PAD,
        minY: -BOUNDS_PAD,
        maxY: BOUNDS_PAD,
      });
      write();
    },
    [write],
  );

  /* --------------------------------------------------------- frame loop */

  const schedule = useCallback(() => {
    if (scheduleRef.current) return;
    scheduleRef.current = true;
    frameRef.current = requestAnimationFrame(() => {
      scheduleRef.current = false;
      const animation = animationRef.current;
      if (animation) {
        const t = Math.min(1, (performance.now() - animation.start) / Math.max(1, animation.duration));
        const eased = easeInOutCubic(t);
        cameraRef.current = {
          x: animation.from.x + (animation.to.x - animation.from.x) * eased,
          y: animation.from.y + (animation.to.y - animation.from.y) * eased,
          scale: animation.from.scale + (animation.to.scale - animation.from.scale) * eased,
        };
        if (t >= 1) {
          animationRef.current = null;
          setIsMoving(false);
        } else {
          schedule();
        }
      } else if (
        Math.abs(velocityRef.current.x) > 0.035 ||
        Math.abs(velocityRef.current.y) > 0.035
      ) {
        const camera = cameraRef.current;
        applyCamera({
          x: camera.x - velocityRef.current.x / camera.scale,
          y: camera.y - velocityRef.current.y / camera.scale,
          scale: camera.scale,
        });
        velocityRef.current = {
          x: velocityRef.current.x * 0.92,
          y: velocityRef.current.y * 0.92,
        };
        schedule();
      } else {
        velocityRef.current = { x: 0, y: 0 };
        setIsMoving(false);
      }
      write();
    });
  }, [applyCamera, write]);

  /* --------------------------------------------------------- viewport */

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setViewport({ w: Math.max(320, rect.width), h: Math.max(320, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("orientationchange", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  useEffect(() => {
    write();
  }, [viewport, write]);

  /* --------------------------------------------------------- gestures */

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const localPoint = (clientX: number, clientY: number) => {
      const rect = element.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const zoomAt = (factor: number, anchor: { x: number; y: number }, animated: boolean) => {
      const current = cameraRef.current;
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
      const world = screenToWorld(current, viewportRef.current, anchor);
      const target: Camera = {
        x: world.x - (anchor.x - viewportRef.current.w / 2) / scale,
        y: world.y - (anchor.y - viewportRef.current.h / 2) / scale,
        scale,
      };
      setHasInteracted(true);
      if (!animated) {
        animationRef.current = null;
        applyCamera(target);
        return;
      }
      animationRef.current = {
        from: { ...current },
        to: target,
        start: performance.now(),
        duration: 420,
      };
      setIsMoving(true);
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) return;
      const point = localPoint(event.clientX, event.clientY);
      pointersRef.current.set(event.pointerId, {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });

      if (pointersRef.current.size >= 2 && pinchRef.current) {
        const [a, b] = [...pointersRef.current.values()];
        const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        const mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
        const pinch = pinchRef.current;
        const scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, pinch.scale * (distance / pinch.distance)),
        );
        const world = screenToWorld(pinch.camera, viewportRef.current, pinch.mid);
        animationRef.current = null;
        applyCamera({
          x: world.x - (mid.x - viewportRef.current.w / 2) / scale,
          y: world.y - (mid.y - viewportRef.current.h / 2) / scale,
          scale,
        });
        setHasInteracted(true);
        return;
      }

      const drag = dragRef.current;
      if (!drag) return;
      const dx = point.x - drag.x;
      const dy = point.y - drag.y;
      animationRef.current = null;
      applyCamera({
        x: drag.camera.x - dx / drag.camera.scale,
        y: drag.camera.y - dy / drag.camera.scale,
        scale: drag.camera.scale,
      });
      const now = performance.now();
      const last = lastMoveRef.current;
      if (last && now - last.time > 4) {
        const k = 1 / (now - last.time);
        velocityRef.current = {
          x: 0.55 * velocityRef.current.x + 0.45 * ((point.x - last.x) * k),
          y: 0.55 * velocityRef.current.y + 0.45 * ((point.y - last.y) * k),
        };
        lastMoveRef.current = { time: now, x: point.x, y: point.y };
      }
      setHasInteracted(true);
    };

    const detach = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    const onPointerUp = (event: PointerEvent) => {
      const point = localPoint(event.clientX, event.clientY);
      pointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;

      if (pointersRef.current.size === 1) {
        const [remaining] = [...pointersRef.current.values()];
        dragRef.current = {
          x: remaining.x - element.getBoundingClientRect().left,
          y: remaining.y - element.getBoundingClientRect().top,
          camera: { ...cameraRef.current },
        };
        lastMoveRef.current = { time: performance.now(), x: dragRef.current.x, y: dragRef.current.y };
        return;
      }

      detach();
      const drag = dragRef.current;
      dragRef.current = null;
      const moved = drag ? Math.hypot(point.x - drag.x, point.y - drag.y) : 0;

      if (moved < TAP_SLOP) {
        velocityRef.current = { x: 0, y: 0 };
        const now = performance.now();
        const last = lastTapRef.current;
        if (
          last &&
          now - last.time < DOUBLE_TAP_MS &&
          Math.hypot(point.x - last.x, point.y - last.y) < 34
        ) {
          lastTapRef.current = null;
          zoomAt(1.85, point, true);
        } else {
          lastTapRef.current = { time: now, x: point.x, y: point.y };
        }
        return;
      }

      if (Math.hypot(velocityRef.current.x, velocityRef.current.y) > 0.035) {
        setIsMoving(true);
        schedule();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const point = localPoint(event.clientX, event.clientY);
      pointersRef.current.set(event.pointerId, {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });
      animationRef.current = null;
      velocityRef.current = { x: 0, y: 0 };

      if (pointersRef.current.size === 2) {
        const [a, b] = [...pointersRef.current.values()];
        pinchRef.current = {
          distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          scale: cameraRef.current.scale,
          mid: localPoint((a.x + b.x) / 2, (a.y + b.y) / 2),
          camera: { ...cameraRef.current },
        };
        dragRef.current = null;
      } else if (pointersRef.current.size === 1) {
        dragRef.current = { x: point.x, y: point.y, camera: { ...cameraRef.current } };
        lastMoveRef.current = { time: performance.now(), x: point.x, y: point.y };
      }

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      setHasInteracted(true);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.ctrlKey || event.metaKey ? event.deltaY * 0.55 : event.deltaY;
      zoomAt(Math.exp(-delta * 0.0016), localPoint(event.clientX, event.clientY), false);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("pointerdown", onPointerDown);
    return () => {
      detach();
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("pointerdown", onPointerDown);
    };
  }, [applyCamera, schedule]);

  /* --------------------------------------------------------- keyboard */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const step = 150;
      const camera = cameraRef.current;
      if (event.key === "ArrowLeft") applyCamera({ ...camera, x: camera.x - step / camera.scale });
      else if (event.key === "ArrowRight") applyCamera({ ...camera, x: camera.x + step / camera.scale });
      else if (event.key === "ArrowUp") applyCamera({ ...camera, y: camera.y - step / camera.scale });
      else if (event.key === "ArrowDown") applyCamera({ ...camera, y: camera.y + step / camera.scale });
      else return;
      event.preventDefault();
      setHasInteracted(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyCamera]);

  /* --------------------------------------------------------- api */

  const flyTo = useCallback(
    (x: number, y: number, scale: number, duration = 700) => {
      if (duration <= 0) {
        animationRef.current = null;
        applyCamera({ x, y, scale });
        return;
      }
      animationRef.current = {
        from: { ...cameraRef.current },
        to: { x, y, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) },
        start: performance.now(),
        duration,
      };
      setIsMoving(true);
      schedule();
    },
    [applyCamera, schedule],
  );

  const zoomBy = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      const current = cameraRef.current;
      const point = anchor ?? { x: viewportRef.current.w / 2, y: viewportRef.current.h / 2 };
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
      const world = screenToWorld(current, viewportRef.current, point);
      setHasInteracted(true);
      applyCamera({
        x: world.x - (point.x - viewportRef.current.w / 2) / scale,
        y: world.y - (point.y - viewportRef.current.h / 2) / scale,
        scale,
      });
    },
    [applyCamera],
  );

  const centerOnWorld = useCallback(
    (x: number, y: number) => {
      applyCamera({ ...cameraRef.current, x, y });
    },
    [applyCamera],
  );

  const nudge = useCallback(
    (dxScreen: number, dyScreen: number) => {
      const camera = cameraRef.current;
      setHasInteracted(true);
      applyCamera({
        ...camera,
        x: camera.x - dxScreen / camera.scale,
        y: camera.y - dyScreen / camera.scale,
      });
    },
    [applyCamera],
  );

  return useMemo(
    () => ({
      containerRef,
      layerRef,
      cameraRef,
      viewport,
      semantics,
      hasInteracted,
      isMoving,
      flyTo,
      zoomBy,
      centerOnWorld,
      nudge,
    }),
    [
      viewport,
      semantics,
      hasInteracted,
      isMoving,
      flyTo,
      zoomBy,
      centerOnWorld,
      nudge,
    ],
  );
}

export type { Camera };
