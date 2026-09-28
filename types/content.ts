export type SubjectId = "math" | "physics" | "chemistry";

export type AtlasDepth = 0 | 1 | 2 | 3;

export type NodeStatus = "placeholder" | "prototype" | "active";

export type FunctionalConceptId =
  | "geo-angles"
  | "geo-area"
  | "geo-perimeter"
  | "geo-triangles"
  | "geo-pythagoras";

export interface Vec2 {
  x: number;
  y: number;
}

export interface AtlasNode {
  id: string;
  subject: SubjectId;
  depth: AtlasDepth;
  parentId: string | null;
  domainId: string | null;
  title: string;
  shortTitle: string;
  /** one-line description shown on cards */
  blurb?: string;
  /** motto shown under a subject or territory title */
  motto?: string;
  /** 6..9 = Ensino Fundamental, 10 = 1º EM, 11 = 2º EM, 12 = 3º EM */
  recommendedYears: number[];
  status: NodeStatus;
  /** offset relative to the parent node, in world units */
  position: Vec2;
  /** radial angle used for label anchoring */
  angle: number;
  /** outbound semantic connections (concept level) */
  connections: string[];
  hasConcept: boolean;
  hasMarathon: boolean;
  /** functional concept implementation key */
  conceptId?: FunctionalConceptId;
  /** 3 letter code used in problem seed prefixes */
  code?: string;
}

export interface SubjectIsland extends AtlasNode {
  depth: 0;
  motto: string;
}

export interface AtlasGraph {
  nodes: AtlasNode[];
  byId: Record<string, AtlasNode>;
  subjects: AtlasNode[];
  childrenOf: Record<string, AtlasNode[]>;
  world: Record<string, Vec2>;
  order: string[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export function nodeWorldPosition(
  graph: AtlasGraph,
  id: string,
): Vec2 {
  return graph.world[id] ?? { x: 0, y: 0 };
}

export const YEAR_LABELS: Record<number, string> = {
  6: "6º ano",
  7: "7º ano",
  8: "8º ano",
  9: "9º ano",
  10: "1º EM",
  11: "2º EM",
  12: "3º EM",
};

export const YEAR_SHORT: Record<number, string> = {
  6: "6º",
  7: "7º",
  8: "8º",
  9: "9º",
  10: "1º EM",
  11: "2º EM",
  12: "3º EM",
};

export const ALL_YEARS: number[] = [6, 7, 8, 9, 10, 11, 12];

export const SUBJECT_TITLES: Record<SubjectId, string> = {
  math: "MATEMÁTICA",
  physics: "FÍSICA",
  chemistry: "QUÍMICA",
};
