"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Camera } from "@/lib/atlas/camera";
import type { Bounds } from "@/lib/atlas/viewport";

interface MiniMapProps {
  cameraRef: React.MutableRefObject<Camera>;
  viewport: { w: number; h: number };
  bounds: Bounds;
  dots: Array<{ id: string; x: number; y: number; depth: number }>;
  onNavigate: (x: number, y: number) => void;
}

const WIDTH = 164;
const HEIGHT = 104;
const PADDING = 9;

export function MiniMap({ cameraRef, viewport, bounds, dots, onNavigate }: MiniMapProps) {
  const rectRef = useRef<SVGRectElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const transform = useMemo(() => {
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.min((WIDTH - PADDING * 2) / width, (HEIGHT - PADDING * 2) / height);
    return {
      scale,
      offsetX: WIDTH / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
      offsetY: HEIGHT / 2 - ((bounds.minY + bounds.maxY) / 2) * scale,
    };
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
        rect.setAttribute("width", String(Math.max(5, halfW * 2 * transform.scale)));
        rect.setAttribute("height", String(Math.max(5, halfH * 2 * transform.scale)));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cameraRef, transform, viewport]);

  const toWorld = (clientX: number, clientY: number, element: SVGSVGElement) => {
    const box = element.getBoundingClientRect();
    const x = ((clientX - box.left) / box.width) * WIDTH;
    const y = ((clientY - box.top) / box.height) * HEIGHT;
    return {
      x: (x - transform.offsetX) / transform.scale,
      y: (y - transform.offsetY) / transform.scale,
    };
  };

  return (
    <div className="absolute bottom-6 left-[92px] z-10 hidden opacity-40 transition-opacity duration-300 hover:opacity-80 md:block">
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`atlas-surface border border-white/10 bg-black/70 ${
          dragging ? "cursor-grabbing" : "cursor-crosshair"
        }`}
        aria-label="Minimapa"
        role="img"
        onPointerDown={(event) => {
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
            cx={transform.offsetX + dot.x * transform.scale}
            cy={transform.offsetY + dot.y * transform.scale}
            r={dot.depth === 0 ? 2.4 : dot.depth === 1 ? 1.4 : 0.8}
            fill="#ffffff"
            fillOpacity={dot.depth === 0 ? 0.8 : dot.depth === 1 ? 0.45 : 0.25}
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
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
