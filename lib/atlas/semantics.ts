import { ATLAS } from "@/content";
import { TIER_THRESHOLDS } from "@/content/layout";
import type { Camera } from "./camera";

export interface SemanticState {
  tier: number;
  subjectId: string;
  domainId: string | null;
  topicId: string | null;
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

export function scaleTier(scale: number): number {
  if (scale < TIER_THRESHOLDS[0]) return 0;
  if (scale < TIER_THRESHOLDS[1]) return 1;
  if (scale < TIER_THRESHOLDS[2]) return 2;
  return 3;
}

export function computeSemantics(camera: Camera, previous: SemanticState | null): SemanticState {
  const tier = scaleTier(camera.scale);
  const subjectIds = ATLAS.subjects.map((n) => n.id);
  const subjectId =
    nearest(camera, subjectIds, previous?.subjectId ?? null, 0.74) ?? subjectIds[0];

  let domainId: string | null = null;
  if (subjectId) {
    const domains = (ATLAS.childrenOf[subjectId] ?? []).map((n) => n.id);
    domainId = nearest(
      camera,
      domains,
      previous?.subjectId === subjectId ? (previous?.domainId ?? null) : null,
      0.8,
    );
  }

  let topicId: string | null = null;
  if (domainId) {
    const topics = (ATLAS.childrenOf[domainId] ?? []).map((n) => n.id);
    topicId = nearest(
      camera,
      topics,
      previous?.domainId === domainId ? (previous?.topicId ?? null) : null,
      0.8,
    );
  }

  const key = `${tier}|${subjectId}|${domainId ?? "-"}|${topicId ?? "-"}`;
  return { tier, subjectId, domainId, topicId, key };
}

export function subjectIds(): string[] {
  return ATLAS.subjects.map((n) => n.id);
}
