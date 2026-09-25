"use client";

export function ZoomHint() {
  return (
    <div className="pointer-events-none absolute bottom-[54px] left-1/2 z-20 -translate-x-1/2 fade-in">
      <div className="flex flex-col items-center">
        <svg width="46" height="30" viewBox="0 0 46 30" aria-hidden="true" className="mb-3">
          <g stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" fill="none">
            <path d="M4 24 L14 14 L24 20 L34 10" strokeOpacity="0.22" />
            <path d="M12 26 L22 18 L32 22" strokeOpacity="0.14" />
          </g>
          <g fill="#ffffff">
            <circle cx="17" cy="9" r="2.2" className="atlas-pinch-left" />
            <circle cx="29" cy="9" r="2.2" className="atlas-pinch-right" />
          </g>
          <g stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1">
            <path d="M17 14.5 L17 18" />
            <path d="M29 14.5 L29 18" />
          </g>
        </svg>

        <div className="flex items-center gap-4">
          <span className="block h-px w-16 bg-white/25 sm:w-24" />
          <span className="font-display text-[10.5px] tracking-[0.42em] text-white/70">
            ENCONTRE SUA ILHA
          </span>
          <span className="block h-px w-16 bg-white/25 sm:w-24" />
        </div>
      </div>
    </div>
  );
}
