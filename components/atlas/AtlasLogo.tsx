"use client";

interface AtlasMarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function AtlasMark({ size = 42, animated = true, className }: AtlasMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="atlas-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="60" cy="60" r="46" fill="url(#atlas-core)" />

      <g className={animated ? "orbit-slow" : undefined}>
        <circle
          cx="60"
          cy="60"
          r="46"
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="0.9"
          strokeDasharray="1.5 7"
        />
        <circle cx="60" cy="14" r="2.1" fill="#ffffff" />
      </g>

      <g className={animated ? "orbit-rev" : undefined}>
        <circle cx="60" cy="60" r="33" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="0.8" />
        <circle cx="60" cy="93" r="1.6" fill="#ffffff" fillOpacity="0.75" />
      </g>

      <g stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.92">
        <path d="M60 27 L41.5 92" />
        <path d="M60 27 L78.5 92" />
        <path d="M49.5 70.5 L70.5 70.5" />
      </g>

      <circle cx="60" cy="60" r="9.5" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="4.4" fill="#ffffff" />

      <g fill="#ffffff" fillOpacity="0.65">
        <circle cx="27.5" cy="39" r="1.3" />
        <circle cx="92.5" cy="81" r="1.3" />
      </g>
    </svg>
  );
}

interface AtlasLogoProps {
  size?: number;
  wordmark?: boolean;
  stack?: boolean;
  className?: string;
}

export function AtlasLogo({ size = 42, wordmark = true, stack = false, className }: AtlasLogoProps) {
  return (
    <span
      className={`inline-flex ${stack ? "flex-col items-center gap-3" : "items-center gap-3"} ${className ?? ""}`}
    >
      <AtlasMark size={size} />
      {wordmark ? (
        <span
          className="font-display text-white"
          style={{
            fontSize: stack ? size * 0.62 : size * 0.46,
            letterSpacing: "0.62em",
            fontWeight: 300,
            paddingLeft: "0.2em",
          }}
        >
          ATLAS
        </span>
      ) : null}
    </span>
  );
}
