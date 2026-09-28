"use client";

import type { ReactNode } from "react";

/**
 * One line-icon per node. Everything shares the same grid (24×24), stroke and
 * optical weight so a grid of cards reads as a single family.
 */
export function NodeIcon({ id, className = "h-5 w-5" }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyphFor(id)}
    </svg>
  );
}

function glyphFor(id: string): ReactNode {
  const exact = GLYPHS[id];
  if (exact) return exact;
  if (id.startsWith("phy-")) return GLYPHS["phy-motion"];
  if (id.startsWith("chem-")) return GLYPHS["chem-matter"];
  if (id.startsWith("num-")) return GLYPHS["math-numbers"];
  if (id.startsWith("alg-")) return GLYPHS["math-algebra"];
  if (id.startsWith("med-")) return GLYPHS["math-measures"];
  if (id.startsWith("func-")) return GLYPHS["math-functions"];
  if (id.startsWith("sta-")) return GLYPHS["math-stats"];
  if (id.startsWith("fin-")) return GLYPHS["math-finance"];
  if (id.startsWith("trig-")) return GLYPHS["math-trig"];
  if (id.startsWith("geo-")) return GLYPHS["geo"];
  return GLYPHS["default"];
}

const GLYPHS: Record<string, ReactNode> = {
  default: (
    <>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),

  /* subjects ---------------------------------------------------------- */
  "math-root": (
    <>
      <path d="M8 8.5h8" />
      <path d="M10.6 8.5 9.4 19" />
      <path d="M14.4 8.5 13.6 19" />
      <path d="M9.5 15.5h5" />
    </>
  ),
  "physics-root": (
    <>
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
    </>
  ),
  "chemistry-root": (
    <>
      <path d="M12 4.2 18.4 8v8L12 19.8 5.6 16V8Z" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),

  /* mathematics ------------------------------------------------------- */
  "math-numbers": (
    <>
      <rect x="4.5" y="5" width="15" height="14" rx="1.6" />
      <path d="M9.5 5v14M14.5 5v14" />
      <path d="M4.5 10h15" />
      <circle cx="7" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  "math-algebra": (
    <>
      <path d="M7 7.5c2.2 0 4.6 5 7.6 5s3.4-5 3.4-5" />
      <path d="M7 16.5c2.2 0 4.6-5 7.6-5s3.4 5 3.4 5" />
    </>
  ),
  geo: (
    <>
      <path d="M4.5 18.5 12 5l7.5 13.5Z" />
      <path d="M8.4 18.5 12 12l3.6 6.5" />
    </>
  ),
  "math-measures": (
    <>
      <path d="M3.6 15.2 15.2 3.6l5.2 5.2L8.8 20.4Z" />
      <path d="M8 10.8l1.8 1.8M11 7.8l1.8 1.8M14 4.8l1.8 1.8" />
    </>
  ),
  "math-functions": (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M5.5 18c4-1 6-12 13-13" />
    </>
  ),
  "math-stats": (
    <>
      <path d="M4 20h16" />
      <rect x="6" y="11" width="3" height="6" />
      <rect x="10.5" y="7" width="3" height="10" />
      <rect x="15" y="13" width="3" height="4" />
    </>
  ),
  "math-finance": (
    <>
      <ellipse cx="12" cy="7" rx="6.5" ry="2.6" />
      <path d="M5.5 7v5c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6V7" />
      <path d="M5.5 12v5c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6v-5" />
    </>
  ),
  "math-trig": (
    <>
      <path d="M3.5 18.5h17" />
      <path d="M3.5 18.5C7 18.5 7 6 12 6s5 12.5 8.5 12.5" />
    </>
  ),

  /* geometry ---------------------------------------------------------- */
  "geo-angles": (
    <>
      <path d="M4.5 19h15" />
      <path d="M4.5 19 15 5.5" />
      <path d="M11.6 19a8 8 0 0 0-2.4-5.6" />
    </>
  ),
  "geo-polygons": (
    <>
      <path d="M12 4.4 19.6 10l-2.9 9H7.3L4.4 10Z" />
    </>
  ),
  "geo-triangles": (
    <>
      <path d="M12 5 20 19H4Z" />
      <path d="M12 5v14" strokeDasharray="2 3" />
    </>
  ),
  "geo-perimeter": (
    <>
      <rect x="4.5" y="5.5" width="15" height="13" rx="1.4" strokeDasharray="3 3" />
      <circle cx="4.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="18.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  "geo-area": (
    <>
      <rect x="4.5" y="5.5" width="15" height="13" rx="1" />
      <path d="M4.5 9.5h15M4.5 13.5h15M9 5.5v13M14 5.5v13" strokeOpacity="0.5" />
    </>
  ),
  "geo-similarity": (
    <>
      <path d="M4 17 8 9l4 8Z" />
      <path d="M13 19 17.5 8 22 19Z" />
    </>
  ),
  "geo-congruence": (
    <>
      <rect x="4" y="8" width="10" height="10" rx="1" />
      <rect x="8" y="4" width="10" height="10" rx="1" strokeDasharray="2.5 2.5" />
    </>
  ),
  "geo-pythagoras": (
    <>
      <path d="M6 19h9L6 10Z" />
      <rect x="6" y="10" width="4" height="4" />
      <path d="M15 19v-4h4" />
    </>
  ),
  "geo-circle": (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 12h7.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  "geo-space": (
    <>
      <path d="M12 3.6 20 8v8l-8 4.4L4 16V8Z" />
      <path d="M4 8l8 4.4L20 8M12 12.4v8" />
    </>
  ),
  "geo-analytic": (
    <>
      <path d="M4 20V4M4 20h16" />
      <circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 15 15.5 9" strokeDasharray="2.5 2.5" />
    </>
  ),

  /* physics ----------------------------------------------------------- */
  "phy-motion": (
    <>
      <path d="M4 12h11" />
      <path d="M11 8l4 4-4 4" />
      <path d="M4 7.5h4M4 16.5h4" strokeOpacity="0.6" />
    </>
  ),
  "phy-forces": (
    <>
      <rect x="9" y="9" width="10" height="10" rx="1.4" />
      <path d="M6 14h-3M4 11.5 1.5 14 4 16.5" />
    </>
  ),
  "phy-energy": (
    <>
      <path d="M13.5 3 6 13.5h5L10.5 21 18 10.5h-5Z" />
    </>
  ),
  "phy-waves": (
    <>
      <path d="M3 12c2.2 0 2.2-5 4.5-5s2.3 5 4.5 5 2.3-5 4.5-5 2.2 5 4.5 5" />
      <path d="M3 17h18" strokeOpacity="0.4" />
    </>
  ),
  "phy-electricity": (
    <>
      <path d="M12 3.5 7 13h4.5L11 20.5 17 11h-4.5Z" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
    </>
  ),
  "phy-heat": (
    <>
      <path d="M10 4.5a2 2 0 0 1 4 0v9.2a4 4 0 1 1-4 0Z" />
      <path d="M12 8v8" />
    </>
  ),
  "phy-optics": (
    <>
      <path d="M3.5 12c3-4 5.5-6 8.5-6s5.5 2 8.5 6c-3 4-5.5 6-8.5 6s-5.5-2-8.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  "phy-matter": (
    <>
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
      <circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),

  /* chemistry --------------------------------------------------------- */
  "chem-matter": (
    <>
      <circle cx="8" cy="15" r="2.4" />
      <circle cx="15.5" cy="15" r="2.4" />
      <circle cx="11.8" cy="8" r="2.4" />
      <path d="M9.8 13.1 10.9 10.3M13.9 13.1 12.7 10.3M10.4 15h2.7" strokeOpacity="0.6" />
    </>
  ),
  "chem-atomic": (
    <>
      <circle cx="12" cy="12" r="1.8" />
      <ellipse cx="12" cy="12" rx="8.6" ry="3.4" />
      <ellipse cx="12" cy="12" rx="8.6" ry="3.4" transform="rotate(65 12 12)" />
    </>
  ),
  "chem-periodic": (
    <>
      <rect x="4" y="4.5" width="16" height="15" rx="1.4" />
      <path d="M4 9.5h16M4 14.5h16M9.3 4.5v15M14.6 4.5v15" strokeOpacity="0.6" />
    </>
  ),
  "chem-bonds": (
    <>
      <circle cx="6.5" cy="12" r="2.6" />
      <circle cx="17.5" cy="12" r="2.6" />
      <path d="M9.1 12h5.8" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  "chem-reactions": (
    <>
      <path d="M4 8.5h9M11 6l2.5 2.5L11 11" />
      <path d="M20 15.5h-9M13 13l-2.5 2.5L13 18" />
    </>
  ),
  "chem-stoich": (
    <>
      <path d="M12 4v3M6 20h12M12 7 6 20M12 7l6 13" />
      <path d="M8.4 14.5h7.2" />
    </>
  ),
  "chem-solutions": (
    <>
      <path d="M12 3.5c3.2 3.8 5.5 6.7 5.5 9.5a5.5 5.5 0 1 1-11 0c0-2.8 2.3-5.7 5.5-9.5Z" />
      <path d="M8 14.5a4 4 0 0 0 3 4" strokeOpacity="0.6" />
    </>
  ),
  "chem-acids": (
    <>
      <path d="M12 4 20 18H4Z" />
      <path d="M12 10v4M12 16.4v.2" />
    </>
  ),
  "chem-thermo": (
    <>
      <path d="M12 3.5c1.8 2.6 3.4 4.2 3.4 6.6a3.4 3.4 0 1 1-6.8 0c0-2.4 1.6-4 3.4-6.6Z" />
      <path d="M8 20h8" strokeOpacity="0.6" />
    </>
  ),
  "chem-organic": (
    <>
      <path d="M4 17.5 8.5 10l4.5 7.5L17.5 10l2.5 4.2" />
      <circle cx="4" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};
