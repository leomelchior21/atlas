import { DIFFICULTIES, type DifficultyId } from "../problems/types";
import { emptyConceptProgress, type ConceptProgress } from "../progress/types";

const DIFFICULTY_WEIGHT: Record<DifficultyId, number> = {
  leve: 1,
  normal: 1.6,
  avancada: 2.6,
};

const EXPOSURE_TARGET = 4;
const FAMILY_TARGET = 6;
const RECENT_WINDOW = 8;

export interface MasteryBreakdown {
  overall: number;
  depth: number;
  accuracy: number;
  diversity: number;
  recentForm: number;
  byDifficulty: Record<DifficultyId, { accuracy: number; attempts: number; exposure: number }>;
  nextStep: string | null;
}

export function computeMastery(
  progress: ConceptProgress | undefined,
  familyCount: number,
): MasteryBreakdown {
  const record = progress ?? emptyConceptProgress("unknown");
  const byDifficulty = {} as MasteryBreakdown["byDifficulty"];
  let weightedDepth = 0;
  let weightTotal = 0;
  let solvedTotal = 0;
  let attemptedTotal = 0;

  for (const difficulty of DIFFICULTIES) {
    const bucket = record.byDifficulty[difficulty];
    const weight = DIFFICULTY_WEIGHT[difficulty];
    const exposure = Math.min(1, bucket.attempts / EXPOSURE_TARGET);
    const accuracy = bucket.attempts > 0 ? bucket.correct / bucket.attempts : 0;
    byDifficulty[difficulty] = { accuracy, attempts: bucket.attempts, exposure };
    weightedDepth += weight * exposure * accuracy;
    weightTotal += weight;
    solvedTotal += bucket.correct;
    attemptedTotal += bucket.attempts;
  }

  const depth = weightTotal > 0 ? weightedDepth / weightTotal : 0;
  const accuracy = attemptedTotal > 0 ? solvedTotal / attemptedTotal : 0;

  const distinctFamilies = new Set<string>();
  for (const difficulty of DIFFICULTIES) {
    for (const [familyId, family] of Object.entries(record.byDifficulty[difficulty].families)) {
      if (family.correct > 0) distinctFamilies.add(familyId);
    }
  }
  const diversity = Math.min(1, distinctFamilies.size / Math.min(Math.max(familyCount, 1), FAMILY_TARGET));

  const recent = record.recent.slice(0, RECENT_WINDOW);
  const recentForm = recent.length >= 4 ? Math.min(1, 0.5 + record.streak * 0.08) : 0.5;

  const overall = Math.max(
    0,
    Math.min(100, 100 * depth * (0.55 + 0.3 * diversity + 0.15 * recentForm)),
  );

  let nextStep: string | null = null;
  if (attemptedTotal === 0) nextStep = "Resolva a primeira questão";
  else if (record.byDifficulty.leve.attempts < EXPOSURE_TARGET) nextStep = "Pratique mais no nível LEVE";
  else if (record.byDifficulty.normal.attempts < EXPOSURE_TARGET) nextStep = "Avance para o nível NORMAL";
  else if (record.byDifficulty.avancada.attempts < EXPOSURE_TARGET) nextStep = "Enfrente o nível AVANÇADA";
  else if (diversity < 1) nextStep = "Explore outras famílias de problemas";
  else if (accuracy < 0.85) nextStep = "Revise os erros recentes no conceito";
  else if (overall < 99) nextStep = "Mantenha a constância para fechar o domínio";

  return {
    overall: Math.round(overall * 10) / 10,
    depth: Math.round(depth * 1000) / 1000,
    accuracy: Math.round(accuracy * 1000) / 1000,
    diversity: Math.round(diversity * 1000) / 1000,
    recentForm: Math.round(recentForm * 1000) / 1000,
    byDifficulty,
    nextStep,
  };
}

export function masteryLabel(overall: number): string {
  if (overall <= 0) return "NÃO INICIADO";
  if (overall < 20) return "INICIANDO";
  if (overall < 45) return "EM PROGRESSO";
  if (overall < 70) return "SOLIDIFICANDO";
  if (overall < 90) return "DOMINANDO";
  return "DOMINADO";
}
