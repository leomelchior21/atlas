import type { DifficultyId, RecentSignature } from "../problems/types";

export interface FamilyRecord {
  attempts: number;
  correct: number;
}

export interface DifficultyRecord {
  attempts: number;
  correct: number;
  families: Record<string, FamilyRecord>;
}

export interface ConceptProgress {
  conceptId: string;
  attempts: number;
  correct: number;
  streak: number;
  bestStreak: number;
  byDifficulty: Record<DifficultyId, DifficultyRecord>;
  recent: RecentSignature[];
  misconceptions: Record<string, number>;
  sessions: number;
}

export interface StudentProfile {
  name: string;
  year: number;
}

export interface AtlasProgress {
  version: number;
  student: StudentProfile | null;
  xp: number;
  explorationXp: number;
  explored: string[];
  concepts: Record<string, ConceptProgress>;
  updatedAt: number;
}

export function emptyDifficultyRecord(): DifficultyRecord {
  return { attempts: 0, correct: 0, families: {} };
}

export function emptyConceptProgress(conceptId: string): ConceptProgress {
  return {
    conceptId,
    attempts: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    byDifficulty: {
      leve: emptyDifficultyRecord(),
      normal: emptyDifficultyRecord(),
      avancada: emptyDifficultyRecord(),
    },
    recent: [],
    misconceptions: {},
    sessions: 0,
  };
}

export function emptyProgress(): AtlasProgress {
  return {
    version: 1,
    student: null,
    xp: 0,
    explorationXp: 0,
    explored: [],
    concepts: {},
    updatedAt: Date.now(),
  };
}
