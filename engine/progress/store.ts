import { XP_BY_DIFFICULTY } from "../problems/types";
import type { DifficultyId, GeneratedProblem } from "../problems/types";
import {
  emptyConceptProgress,
  emptyProgress,
  type AtlasProgress,
  type ConceptProgress,
} from "./types";

export const EXPLORATION_XP = 2;
export const EXPLORATION_XP_CAP = 24;
const RECENT_WINDOW = 12;

export interface ProgressRepository {
  load(): AtlasProgress;
  save(progress: AtlasProgress): void;
  clear(): void;
}

const STORAGE_KEY = "atlas.progress.v1";

function sanitize(raw: unknown): AtlasProgress {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<AtlasProgress>;
  return {
    ...base,
    ...data,
    version: 1,
    explored: Array.isArray(data.explored) ? data.explored : [],
    concepts: data.concepts && typeof data.concepts === "object" ? data.concepts : {},
    xp: typeof data.xp === "number" && Number.isFinite(data.xp) ? data.xp : 0,
    explorationXp:
      typeof data.explorationXp === "number" && Number.isFinite(data.explorationXp)
        ? data.explorationXp
        : 0,
  };
}

export const localRepository: ProgressRepository = {
  load() {
    if (typeof window === "undefined") return emptyProgress();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyProgress();
      return sanitize(JSON.parse(raw));
    } catch {
      return emptyProgress();
    }
  },
  save(progress) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* storage full or unavailable — progress stays in memory */
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

/* --------------------------------------------------------------- reducers */

export function setStudent(
  progress: AtlasProgress,
  name: string,
  year: number,
): AtlasProgress {
  return { ...progress, student: { name: name.trim(), year }, updatedAt: Date.now() };
}

export function markExplored(
  progress: AtlasProgress,
  nodeId: string,
  conceptId?: string,
): AtlasProgress {
  if (progress.explored.includes(nodeId)) return progress;
  const gained =
    conceptId && progress.explorationXp < EXPLORATION_XP_CAP ? EXPLORATION_XP : 0;
  return {
    ...progress,
    explored: [...progress.explored, nodeId],
    xp: progress.xp + gained,
    explorationXp: progress.explorationXp + gained,
    updatedAt: Date.now(),
  };
}

export interface AnswerInput {
  problem: GeneratedProblem;
  correct: boolean;
  misconceptionId?: string;
}

export function recordAnswer(progress: AtlasProgress, input: AnswerInput): AtlasProgress {
  const { problem, correct, misconceptionId } = input;
  const conceptId = problem.conceptId;
  const current: ConceptProgress =
    progress.concepts[conceptId] ?? emptyConceptProgress(conceptId);
  const difficulty: DifficultyId = problem.difficulty;

  const diff = current.byDifficulty[difficulty];
  const family = diff.families[problem.familyId] ?? { attempts: 0, correct: 0 };

  const nextDiff = {
    ...current.byDifficulty,
    [difficulty]: {
      attempts: diff.attempts + 1,
      correct: diff.correct + (correct ? 1 : 0),
      families: {
        ...diff.families,
        [problem.familyId]: {
          attempts: family.attempts + 1,
          correct: family.correct + (correct ? 1 : 0),
        },
      },
    },
  };

  const streak = correct ? current.streak + 1 : 0;
  const misconceptions = { ...current.misconceptions };
  if (!correct && misconceptionId) {
    misconceptions[misconceptionId] = (misconceptions[misconceptionId] ?? 0) + 1;
  }

  const recent = [
    {
      familyId: problem.familyId,
      templateId: problem.templateId,
      conceptId,
      context: problem.context,
      magnitude: 0,
    },
    ...current.recent,
  ].slice(0, RECENT_WINDOW);

  const concept: ConceptProgress = {
    ...current,
    attempts: current.attempts + 1,
    correct: current.correct + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(current.bestStreak, streak),
    byDifficulty: nextDiff,
    recent,
    misconceptions,
  };

  return {
    ...progress,
    xp: progress.xp + (correct ? XP_BY_DIFFICULTY[difficulty] : 0),
    concepts: { ...progress.concepts, [conceptId]: concept },
    updatedAt: Date.now(),
  };
}

export function recordSignature(
  progress: AtlasProgress,
  conceptId: string,
  signature: { familyId: string; templateId: string; context?: string; magnitude: number },
): AtlasProgress {
  const current = progress.concepts[conceptId] ?? emptyConceptProgress(conceptId);
  const recent = [
    { ...signature, conceptId },
    ...current.recent.filter(
      (entry) =>
        !(entry.familyId === signature.familyId && entry.templateId === signature.templateId),
    ),
  ].slice(0, RECENT_WINDOW);
  return {
    ...progress,
    concepts: { ...progress.concepts, [conceptId]: { ...current, recent } },
    updatedAt: Date.now(),
  };
}

export function startSession(progress: AtlasProgress, conceptId: string): AtlasProgress {
  const current = progress.concepts[conceptId] ?? emptyConceptProgress(conceptId);
  return {
    ...progress,
    concepts: {
      ...progress.concepts,
      [conceptId]: { ...current, sessions: current.sessions + 1 },
    },
    updatedAt: Date.now(),
  };
}
