import type {
  AtlasDepth,
  AtlasNode,
  FunctionalConceptId,
  NodeStatus,
  SubjectId,
} from "@/types/content";

/* Visual grammar constants — shared by the map renderer and the camera
   thresholds so semantic zoom always agrees with the layout. */

export const SUBJECT_RADIUS = 210;
export const DOMAIN_RING = 470;
export const DOMAIN_RING_STAGGER = 92;
export const DOMAIN_RADIUS = 86;
export const TOPIC_RING_BASE = 168;
export const TOPIC_RING_STEP = 8;
export const TOPIC_RADIUS = 26;
export const SUB_RING_BASE = 108;
export const SUB_RING_STEP = 8;
export const SUB_RADIUS = 12;

export const TIER_THRESHOLDS = [0.6, 1.5, 3.1] as const;

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** deterministic organic offset so rings never look mechanically perfect */
function organic(id: string, index: number, axis: number): number {
  const a = hashString(`${id}:${axis}`);
  const b = hashString(`${id}:${axis}:b`);
  let jitter = (a - 0.5) * 2;
  if (index % 2 === 1) jitter = jitter * 0.35 + (b - 0.5) * 1.2;
  return jitter;
}

export function ringPoint(
  index: number,
  count: number,
  radius: number,
  phase: number,
): { x: number; y: number; angle: number } {
  const step = (Math.PI * 2) / count;
  const angle = phase + index * step;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    angle,
  };
}

export interface NodeSeed {
  id: string;
  title: string;
  shortTitle?: string;
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
    position: { x: number; y: number };
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
  position: { x: number; y: number },
  id: string,
  title: string,
): AtlasNode {
  return makeNode(
    { id, title, years: [6, 7, 8, 9, 10, 11, 12], status: "prototype" },
    {
      subject,
      depth: 0,
      parentId: null,
      domainId: id,
      position,
      angle: 0,
    },
  );
}

export function buildDomainNodes(
  subject: SubjectId,
  domains: DomainSeed[],
  phase = -Math.PI / 2,
): AtlasNode[] {
  const count = domains.length;
  const step = (Math.PI * 2) / count;
  return domains.map((domain, i) => {
    const angle = phase + i * step;
    const radius =
      DOMAIN_RING + (i % 2 === 0 ? -1 : 1) * DOMAIN_RING_STAGGER * 0.5;
    const jr = 1 + organic(domain.id, i, 3) * 0.05;
    const a = angle + organic(domain.id, i, 1) * step * 0.06;
    const position = {
      x: Math.cos(a) * radius * jr,
      y: Math.sin(a) * radius * jr * 0.82,
    };
    return makeNode(domain, {
      subject,
      depth: 1,
      parentId: `${subject}-root`,
      domainId: domain.id,
      position,
      angle: a,
    });
  });
}

export function buildChildNodes(
  parent: AtlasNode,
  seeds: NodeSeed[],
  depth: AtlasDepth,
  phase: number,
): AtlasNode[] {
  const count = seeds.length;
  const step = (Math.PI * 2) / count;
  const radius = (depth === 2 ? TOPIC_RING_BASE : SUB_RING_BASE) +
    count * (depth === 2 ? TOPIC_RING_STEP : SUB_RING_STEP);
  return seeds.map((seed, i) => {
    const a = phase + i * step + organic(seed.id, i, 1) * step * 0.07;
    const r = radius * (1 + organic(seed.id, i, 2) * 0.06);
    return makeNode(seed, {
      subject: parent.subject,
      depth,
      parentId: parent.id,
      domainId: parent.domainId,
      position: { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.9 },
      angle: a,
    });
  });
}

export function fanPhase(count: number, seed = 0): number {
  if (count <= 3) return -Math.PI / 2;
  return -Math.PI / 2 + (hashString(`phase:${count}:${seed}`) - 0.5) * 0.7;
}
