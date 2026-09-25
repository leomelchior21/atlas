import type { Rng } from "@/lib/random";
import type { ValidationIssue } from "@/lib/validation";

export type DifficultyId = "leve" | "normal" | "avancada";

export const DIFFICULTIES: DifficultyId[] = ["leve", "normal", "avancada"];

export const DIFFICULTY_LABELS: Record<DifficultyId, string> = {
  leve: "LEVE",
  normal: "NORMAL",
  avancada: "AVANÇADA",
};

export const XP_BY_DIFFICULTY: Record<DifficultyId, number> = {
  leve: 5,
  normal: 10,
  avancada: 15,
};

/* ------------------------------------------------------------------ diagram */

export type DiagramSpec =
  | { kind: "none" }
  | {
      kind: "right-triangle";
      legA: number;
      legB: number;
      labelA: string;
      labelB: string;
      labelC: string;
      orientation?: "left" | "right";
      caption?: string;
    }
  | {
      kind: "triangle-sides";
      sides: [number, number, number];
      labels: [string, string, string];
      caption?: string;
      rightAngleAt?: number;
    }
  | {
      kind: "rectangle";
      width: number;
      height: number;
      labelWidth?: string;
      labelHeight?: string;
      labelDiagonal?: string;
      diagonal?: boolean;
      caption?: string;
    }
  | {
      kind: "polygon";
      sides: number[];
      labels?: string[];
      caption?: string;
    }
  | {
      kind: "angle";
      degrees: number;
      label?: string;
      caption?: string;
    }
  | {
      kind: "l-shape";
      width: number;
      height: number;
      cutWidth: number;
      cutHeight: number;
      caption?: string;
    }
  | {
      kind: "circle";
      radiusLabel: string;
      showDiameter?: boolean;
      caption?: string;
    };

/* ------------------------------------------------------------------ answers */

export interface AnswerSpec {
  value: number;
  display: string;
  unit?: string;
  kind: "numeric" | "boolean";
}

export interface Alternative {
  id: string;
  value: number;
  display: string;
  correct: boolean;
  misconceptionId?: string;
  feedback?: string;
}

export interface SolutionStep {
  expression: string;
  note?: string;
}

export interface Misconception {
  id: string;
  title: string;
  explanation: string;
  conceptHint?: string;
}

export interface DistractorSpec {
  value: number;
  display?: string;
  misconceptionId: string;
  feedback: string;
}

/* ------------------------------------------------------------------ prompts */

export interface PromptVariant {
  id: string;
  text: string;
}

export interface RecentSignature {
  familyId: string;
  templateId: string;
  conceptId: string;
  context?: string;
  magnitude: number;
}

export interface ProblemDraft {
  prompt: string;
  templateId: string;
  context?: string;
  variables: Record<string, number | string>;
  diagram?: DiagramSpec;
  formula?: string;
  answerValue: number;
  answerDisplay?: string;
  answerKind?: "numeric" | "boolean";
  /** overrides the pack-level alternative count (e.g. 4 for classifications) */
  alternativesCount?: number;
  unit?: string;
  solutionSteps: SolutionStep[];
  distractors: DistractorSpec[];
  /** perceptual fingerprint used by the repetition filter */
  fingerprint: RecentSignature;
  requiresPaper?: boolean;
}

/* ------------------------------------------------------------------ packs */

export interface ProblemFamily {
  id: string;
  title: string;
  description: string;
  difficulties: DifficultyId[];
  weight?: number;
}

export interface GenerateContext {
  rng: Rng;
  seed: string;
  conceptId: string;
  difficulty: DifficultyId;
  family: ProblemFamily;
  templateId: string;
}

export type DraftBuilder = (ctx: GenerateContext) => ProblemDraft | null;

export interface ProblemTemplate {
  id: string;
  familyId: string;
  difficulties: DifficultyId[];
  build: DraftBuilder;
}

export type DraftValidator = (draft: ProblemDraft, ctx: GenerateContext) => ValidationIssue[];

export type DistractorGenerator = (draft: ProblemDraft, ctx: GenerateContext) => DistractorSpec[];

export interface DifficultyRules {
  /** how many alternatives should be produced (best effort) */
  alternatives: number;
  /** decimal places applied to the answer representation */
  decimals: number;
  /** prefer radical representation when the result is irrational */
  allowRadical: boolean;
}

export interface ProblemPack {
  conceptId: string;
  seedPrefix: string;
  families: ProblemFamily[];
  templates: ProblemTemplate[];
  validators: DraftValidator[];
  distractorGenerators: DistractorGenerator[];
  difficultyRules: Record<DifficultyId, DifficultyRules>;
  misconceptions: Misconception[];
  /** unit used when the family does not define one */
  defaultUnit?: string;
}

/* ------------------------------------------------------------------ output */

export interface GeneratedProblem {
  id: string;
  seed: string;
  conceptId: string;
  familyId: string;
  familyTitle: string;
  templateId: string;
  difficulty: DifficultyId;
  prompt: string;
  context?: string;
  variables: Record<string, number | string>;
  diagram: DiagramSpec;
  formula?: string;
  answer: AnswerSpec;
  unit?: string;
  alternatives: Alternative[];
  solutionSteps: SolutionStep[];
  misconceptions: Misconception[];
  requiresPaper: boolean;
  metadata: {
    generatedAt: number;
    attempts: number;
    latencyMs: number;
  };
}

export interface ProblemRequest {
  conceptId: string;
  difficulty: DifficultyId;
  seed?: string;
  familyId?: string;
  templateId?: string;
  recent?: RecentSignature[];
  maxAttempts?: number;
}

export interface GenerationReport {
  problem: GeneratedProblem | null;
  issues: ValidationIssue[];
  attempts: number;
}
