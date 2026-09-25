"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ATLAS, subtreeBounds } from "@/content";
import type { Camera } from "@/lib/atlas/camera";

interface MiniMapProps {
  cameraRef: React.MutableRefObject<Camera>;
  viewport: { w: number; h: number };
  focusSubjectId: string | null;
  onNavigate: (x: number, y: number) => void;
}

const WIDTH = 186;
const HEIGHT = 116;
const PADDING = 10;

export function MiniMap({ cameraRef, viewport, focusSubjectId, onNavigate }: MiniMapProps) {
  const rectRef = useRef<SVGRectElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const bounds = useMemo(() => {
    if (focusSubjectId) return subtreeBounds(focusSubjectId);
    return ATLAS.bounds;
  }, [focusSubjectId]);

  const dots = useMemo(() => {
    const ids = focusSubjectId ? [focusSubjectId, ...descendants(focusSubjectId)] : ATLAS.nodes.map((n) => n.id);
    return ids
      .map((id) => ATLAS.byId[id])
      .filter((node) => node && node.depth <= 2)
      .map((node) => ({ id: node.id, point: ATLAS.world[node.id], depth: node.depth }));
  }, [focusSubjectId]);

  const transform = useMemo(() => {
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.min((WIDTH - PADDING * 2) / width, (HEIGHT - PADDING * 2) / height);
    const offsetX = WIDTH / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
    const offsetY = HEIGHT / 2 - ((bounds.minY + bounds.maxY) / 2) * scale;
    return { scale, offsetX, offsetY };
  }, [bounds]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const camera = cameraRef.current;
      const rect = rectRef.current;
      if (rect) {
        const halfW = viewport.w / 2 / camera.scale;
        const halfH = viewport.h / 2 / camera.scale;
        rect.setAttribute("x", String(transform.offsetX + (camera.x - halfW) * transform.scale));
        rect.setAttribute("y", String(transform.offsetY + (camera.y - halfH) * transform.scale));
        rect.setAttribute("width", String(Math.max(6, halfW * 2 * transform.scale)));
        rect.setAttribute("height", String(Math.max(6, halfH * 2 * transform.scale)));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cameraRef, transform, viewport]);

  const toWorld = (clientX: number, clientY: number, element: SVGSVGElement) => {
    const rect = element.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * WIDTH;
    const y = ((clientY - rect.top) / rect.height) * HEIGHT;
    return {
      x: (x - transform.offsetX) / transform.scale,
      y: (y - transform.offsetY) / transform.scale,
    };
  };

  return (
    <div className="absolute bottom-6 left-[86px] z-20 hidden md:block">
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`atlas-surface border border-white/12 bg-black/60 ${dragging ? "cursor-grabbing" : "cursor-crosshair"}`}
        aria-label="Minimapa"
        role="img"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          const point = toWorld(event.clientX, event.clientY, event.currentTarget);
          onNavigate(point.x, point.y);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          const point = toWorld(event.clientX, event.clientY, event.currentTarget);
          onNavigate(point.x, point.y);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {dots.map((dot) => (
          <circle
            key={dot.id}
            cx={transform.offsetX + dot.point.x * transform.scale}
            cy={transform.offsetY + dot.point.y * transform.scale}
            r={dot.depth === 0 ? 2.6 : dot.depth === 1 ? 1.8 : 0.9}
            fill="#ffffff"
            fillOpacity={dot.depth === 0 ? 0.9 : dot.depth === 1 ? 0.7 : 0.35}
          />
        ))}
        <rect
          ref={rectRef}
          x={0}
          y={0}
          width={10}
          height={10}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function descendants(id: string): string[] {
  const out: string[] = [];
  const walk = (nodeId: string) => {
    for (const child of ATLAS.childrenOf[nodeId] ?? []) {
      out.push(child.id);
      walk(child.id);
    }
  };
  walk(id);
  return out;
}
