import type {
  AtlasDepth,
  AtlasNode,
  FunctionalConceptId,
  NodeStatus,
  SubjectId,
  Vec2,
} from "@/types/content";

/* ---------------------------------------------------------------- grammar
   Visual grammar constants. They are shared by the renderer and by the
   camera/level math, so semantic zoom always agrees with the layout.
*/

export const SUBJECT_RADIUS = 250;
export const DOMAIN_RADIUS = 92;
export const TOPIC_RADIUS = 30;
export const SUB_RADIUS = 13;

export const LABEL_GAP = 22;

/** curated overview spread — the three islands sit on the left/middle/right thirds */
export const SUBJECT_ORIGIN: Record<string, Vec2> = {
  "math-root": { x: 0, y: 0 },
  "physics-root": { x: -2300, y: -120 },
  "chemistry-root": { x: 2300, y: 120 },
};

/** half-extents of the overview composition, used for the initial fit */
export const OVERVIEW_EXTENT = {
  x: 2300 + SUBJECT_RADIUS + 140,
  y: 120 + SUBJECT_RADIUS + 140,
};

/* ------------------------------------------------------------- curated maps
   Handcrafted, deterministic positions. No physics, no randomness:
   the same view is recomposed the same way on every load.
*/

/** Mathematics: the eight territories around the central island. */
export const MATH_TERRITORIES: Record<string, Vec2> = {
  "math-numbers": { x: 0, y: -262 },
  "math-trig": { x: -336, y: -138 },
  "math-algebra": { x: 322, y: -168 },
  "math-stats": { x: -372, y: 44 },
  geo: { x: 356, y: 18 },
  "math-finance": { x: -320, y: 232 },
  "math-measures": { x: 286, y: 244 },
  "math-functions": { x: 0, y: 318 },
};

/** Geometry: eleven concepts in two loose orbital rings. */
export const GEOMETRY_TOPICS: Record<string, Vec2> = {
  "geo-triangles": { x: 118, y: -104 },
  "geo-angles": { x: -104, y: -112 },
  "geo-area": { x: 196, y: 52 },
  "geo-perimeter": { x: 62, y: 172 },
  "geo-similarity": { x: -150, y: 106 },
  "geo-circle": { x: -46, y: -206 },
  "geo-polygons": { x: -248, y: -20 },
  "geo-congruence": { x: 240, y: -186 },
  "geo-pythagoras": { x: -196, y: 212 },
  "geo-space": { x: 34, y: 262 },
  "geo-analytic": { x: -330, y: 128 },
};

/** Triangles: the seven branches around the concept. */
export const TRIANGLE_BRANCHES: Record<string, Vec2> = {
  "geo-tri-class": { x: -10, y: -158 },
  "geo-tri-sum": { x: 116, y: -104 },
  "geo-tri-area": { x: 148, y: 34 },
  "geo-tri-congruence": { x: 92, y: 148 },
  "geo-tri-similarity": { x: -58, y: 156 },
  "geo-tri-right": { x: -152, y: 62 },
  "geo-tri-pythagoras": { x: -136, y: -78 },
};

export type LabelPosition = "top" | "bottom" | "left" | "right";

export interface LabelPlacement {
  position: LabelPosition;
  /** extra offset in world units, on top of LABEL_GAP */
  offset: number;
}

/** curated label placement so nothing sits on top of a node or a line */
const CURATED_LABELS: Record<string, LabelPlacement> = {
  "math-numbers": { position: "top", offset: 0 },
  "math-trig": { position: "left", offset: 0 },
  "math-algebra": { position: "right", offset: 0 },
  "math-stats": { position: "left", offset: 4 },
  geo: { position: "right", offset: 0 },
  "math-finance": { position: "left", offset: 0 },
  "math-measures": { position: "right", offset: 4 },
  "math-functions": { position: "bottom", offset: 6 },

  "geo-triangles": { position: "right", offset: 0 },
  "geo-angles": { position: "left", offset: 0 },
  "geo-area": { position: "right", offset: 2 },
  "geo-perimeter": { position: "bottom", offset: 0 },
  "geo-similarity": { position: "left", offset: 0 },
  "geo-circle": { position: "top", offset: 0 },
  "geo-polygons": { position: "left", offset: 0 },
  "geo-congruence": { position: "right", offset: 6 },
  "geo-pythagoras": { position: "left", offset: 0 },
  "geo-space": { position: "bottom", offset: 0 },
  "geo-analytic": { position: "left", offset: 4 },

  "geo-tri-class": { position: "top", offset: 0 },
  "geo-tri-sum": { position: "right", offset: 0 },
  "geo-tri-area": { position: "right", offset: 0 },
  "geo-tri-congruence": { position: "bottom", offset: 0 },
  "geo-tri-similarity": { position: "bottom", offset: 0 },
  "geo-tri-right": { position: "left", offset: 0 },
  "geo-tri-pythagoras": { position: "left", offset: 0 },
};

export function labelFor(node: AtlasNode): LabelPlacement {
  const curated = CURATED_LABELS[node.id];
  if (curated) return curated;
  const angle = node.angle;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  if (Math.abs(sin) >= Math.abs(cos)) {
    return { position: sin < 0 ? "top" : "bottom", offset: 0 };
  }
  return { position: cos < 0 ? "left" : "right", offset: 0 };
}

/* ------------------------------------------------------------------ helpers */

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** deterministic, slightly irregular ring used for non-curated territories */
export function ringPoint(
  index: number,
  count: number,
  radius: number,
  phase: number,
): { x: number; y: number; angle: number } {
  const step = (Math.PI * 2) / count;
  const angle = phase + index * step;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
}

function fanPoint(index: number, count: number, radius: number, phase: number, squash = 1) {
  const step = (Math.PI * 2) / count;
  const angle = phase + index * step;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * squash,
    angle,
  };
}

/* ------------------------------------------------------------------- seeds */

export interface NodeSeed {
  id: string;
  title: string;
  shortTitle?: string;
  blurb?: string;
  motto?: string;
  years?: number[];
  status?: NodeStatus;
  conceptId?: FunctionalConceptId;
  code?: string;
  connects?: string[];
  children?: NodeSeed[];
}

export interface DomainSeed extends NodeSeed {
  title: string;
  children: NodeSeed[];
}

function makeNode(
  seed: NodeSeed,
  opts: {
    subject: SubjectId;
    depth: AtlasDepth;
    parentId: string | null;
    domainId: string | null;
    position: Vec2;
    angle: number;
  },
): AtlasNode {
  const hasConcept = Boolean(seed.conceptId);
  return {
    id: seed.id,
    subject: opts.subject,
    depth: opts.depth,
    parentId: opts.parentId,
    domainId: opts.domainId,
    title: seed.title,
    shortTitle: seed.shortTitle ?? seed.title,
    ...(seed.blurb ? { blurb: seed.blurb } : {}),
    ...(seed.motto ? { motto: seed.motto } : {}),
    recommendedYears: seed.years ?? [],
    status: seed.status ?? (hasConcept ? "active" : "placeholder"),
    position: opts.position,
    angle: opts.angle,
    connections: seed.connects ?? [],
    hasConcept,
    hasMarathon: hasConcept,
    ...(seed.conceptId ? { conceptId: seed.conceptId } : {}),
    ...(seed.code ? { code: seed.code } : {}),
  };
}

export function buildSubjectNodes(
  subject: SubjectId,
  position: Vec2,
  id: string,
  title: string,
  motto?: string,
): AtlasNode {
  return makeNode(
    {
      id,
      title,
      years: [6, 7, 8, 9, 10, 11, 12],
      status: "prototype",
      ...(motto ? { motto } : {}),
    },
    { subject, depth: 0, parentId: null, domainId: id, position, angle: 0 },
  );
}

/** eight-ish territories around the central island (curated when available) */
export function buildDomainNodes(
  subject: SubjectId,
  domains: DomainSeed[],
  parentId: string,
  anchor: "math" | "ring",
): AtlasNode[] {
  const count = domains.length;
  return domains.map((domain, index) => {
    const curated = anchor === "math" ? MATH_TERRITORIES[domain.id] : undefined;
    let position: Vec2;
    let angle: number;
    if (curated) {
      position = curated;
      angle = Math.atan2(curated.y, curated.x);
    } else {
      // physics / chemistry: two balanced rows of islands
      const row = index % 2;
      const column = Math.floor(index / 2);
      const columns = Math.ceil(count / 2);
      const spread = 300;
      const x = (column - (columns - 1) / 2) * spread;
      const y = row === 0 ? -160 : 190;
      position = { x, y };
      angle = Math.atan2(y, x);
    }
    return makeNode(domain, {
      subject,
      depth: 1,
      parentId,
      domainId: domain.id,
      position,
      angle,
    });
  });
}

/**
 * Children of a domain (depth 2) or of a topic (depth 3).
 * Curated tables win; everything else is a deterministic two-ring fan.
 */
export function buildChildNodes(
  parent: AtlasNode,
  seeds: NodeSeed[],
  depth: AtlasDepth,
  phase: number,
): AtlasNode[] {
  const count = seeds.length;
  const curatedTable =
    depth === 2
      ? parent.id === "geo"
        ? GEOMETRY_TOPICS
        : undefined
      : depth === 3 && parent.id === "geo-triangles"
        ? TRIANGLE_BRANCHES
        : undefined;

  const outerRadius = depth === 2 ? 168 : 150;
  const innerRadius = depth === 2 ? 118 : 104;

  return seeds.map((seed, index) => {
    const curated = curatedTable?.[seed.id];
    if (curated) {
      return makeNode(seed, {
        subject: parent.subject,
        depth,
        parentId: parent.id,
        domainId: parent.domainId,
        position: curated,
        angle: Math.atan2(curated.y, curated.x),
      });
    }
    const onOuter = index % 2 === 0;
    const ringCount = Math.ceil(count / 2);
    const ringIndex = Math.floor(index / 2);
    const point = fanPoint(
      ringIndex,
      Math.max(1, ringCount),
      onOuter ? outerRadius : innerRadius,
      phase + (onOuter ? 0 : Math.PI / Math.max(2, ringCount)),
      0.92,
    );
    return makeNode(seed, {
      subject: parent.subject,
      depth,
      parentId: parent.id,
      domainId: parent.domainId,
      position: { x: point.x, y: point.y },
      angle: point.angle,
    });
  });
}

export function fanPhase(count: number, seed = 0): number {
  return -Math.PI / 2 + (hashString(`phase:${count}:${seed}`) - 0.5) * 0.5;
}

/* ------------------------------------------------------------------ levels */

/** content radius of each semantic level, used to fit the camera */
export function levelRadius(level: 0 | 1 | 2 | 3): { x: number; y: number } {
  if (level === 0) return OVERVIEW_EXTENT;
  if (level === 1) {
    const maxX = Math.max(...Object.values(MATH_TERRITORIES).map((p) => Math.abs(p.x)));
    const maxY = Math.max(...Object.values(MATH_TERRITORIES).map((p) => Math.abs(p.y)));
    return { x: maxX + DOMAIN_RADIUS + 96, y: maxY + DOMAIN_RADIUS + 96 };
  }
  if (level === 2) {
    const maxX = Math.max(...Object.values(GEOMETRY_TOPICS).map((p) => Math.abs(p.x)));
    const maxY = Math.max(...Object.values(GEOMETRY_TOPICS).map((p) => Math.abs(p.y)));
    return { x: maxX + TOPIC_RADIUS + 78, y: maxY + TOPIC_RADIUS + 78 };
  }
  const maxX = Math.max(...Object.values(TRIANGLE_BRANCHES).map((p) => Math.abs(p.x)));
  const maxY = Math.max(...Object.values(TRIANGLE_BRANCHES).map((p) => Math.abs(p.y)));
  return { x: maxX + SUB_RADIUS + 68, y: maxY + SUB_RADIUS + 68 };
}
