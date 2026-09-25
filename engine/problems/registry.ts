import { anglesPack } from "./packs/angles";
import { areaPack } from "./packs/area";
import { perimeterPack } from "./packs/perimeter";
import { pythagorasPack } from "./packs/pythagoras";
import { trianglesPack } from "./packs/triangles";
import { generateFromPack } from "./engine";
import type { GeneratedProblem, ProblemPack, ProblemRequest } from "./types";

export const PROBLEM_PACKS: Record<string, ProblemPack> = {
  "geo-pythagoras": pythagorasPack,
  "geo-angles": anglesPack,
  "geo-area": areaPack,
  "geo-perimeter": perimeterPack,
  "geo-triangles": trianglesPack,
};

export function getPack(conceptId: string): ProblemPack | undefined {
  return PROBLEM_PACKS[conceptId];
}

export function hasPack(conceptId: string): boolean {
  return Boolean(PROBLEM_PACKS[conceptId]);
}

export function generateProblem(request: ProblemRequest): GeneratedProblem | null {
  const pack = getPack(request.conceptId);
  if (!pack) return null;
  const report = generateFromPack(pack, request);
  return report.problem;
}

export function conceptFamilies(conceptId: string) {
  return PROBLEM_PACKS[conceptId]?.families ?? [];
}
