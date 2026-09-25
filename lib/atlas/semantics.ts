import { ATLAS } from "@/content";
import type { AtlasNode } from "@/types/content";
import type { Camera } from "./camera";
import { computeLevelScales, scaleTier, type LevelScales, type Rect } from "./levels";

export interface SemanticState {
  /** 0 overview · 1 subject · 2 domain · 3 concept */
  tier: number;
  /** the node the camera is closest to at the current depth */
  subjectId: string;
  domainId: string | null;
  topicId: string | null;
  /** the node that acts as the center of this level */
  centerId: string;
  thresholds: [number, number, number];
  scales: LevelScales;
  key: string;
}

function distanceTo(camera: Camera, nodeId: string): number {
  const point = ATLAS.world[nodeId];
  if (!point) return Number.POSITIVE_INFINITY;
  return Math.hypot(point.x - camera.x, point.y - camera.y);
}

function nearest(
  camera: Camera,
  candidates: string[],
  previousId: string | null,
  hysteresis = 0.82,
): string | null {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const id of candidates) {
    const d = distanceTo(camera, id);
    if (d < bestDistance) {
      bestDistance = d;
      best = id;
    }
  }
  if (!best) return null;
  if (previousId && candidates.includes(previousId) && previousId !== best) {
    const previousDistance = distanceTo(camera, previousId);
    if (previousDistance <= bestDistance / hysteresis) return previousId;
  }
  return best;
}

/** children that can act as the center of a deeper level */
function centerCandidates(parentId: string | null): string[] {
  if (!parentId) return ATLAS.subjects.map((node) => node.id);
  return (ATLAS.childrenOf[parentId] ?? [])
    .filter((child) => (ATLAS.childrenOf[child.id] ?? []).length > 0 || child.hasConcept)
    .map((child) => child.id);
}

export function computeSemantics(
  camera: Camera,
  previous: SemanticState | null,
  rect: Rect,
): SemanticState {
  const scales = computeLevelScales(rect);
  const thresholds = scales.thresholds;
  const tier = scaleTier(camera.scale, thresholds);

  const subjectId =
    nearest(
      camera,
      ATLAS.subjects.map((node) => node.id),
      previous?.subjectId ?? null,
      0.74,
    ) ?? "math-root";

  const domainId = nearest(
    camera,
    (ATLAS.childrenOf[subjectId] ?? []).map((node) => node.id),
    previous?.subjectId === subjectId ? (previous?.domainId ?? null) : null,
    0.8,
  );

  const topicId = domainId
    ? nearest(
        camera,
        centerCandidates(domainId),
        previous?.domainId === domainId ? (previous?.topicId ?? null) : null,
        0.8,
      )
    : null;

  const centerId =
    tier === 0
      ? "math-root"
      : tier === 1
        ? subjectId
        : tier === 2
          ? (domainId ?? subjectId)
          : (topicId ?? domainId ?? subjectId);

  return {
    tier,
    subjectId,
    domainId,
    topicId,
    centerId,
    thresholds,
    scales,
    key: `${tier}|${centerId}`,
  };
}

export function nodeAtDepth(id: string | null): AtlasNode | undefined {
  return id ? ATLAS.byId[id] : undefined;
}
