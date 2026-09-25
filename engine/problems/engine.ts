import { formatFixed, formatNumber, isInteger, round } from "@/lib/format";
import { createRng, makeSeed } from "@/lib/random";
import { hasErrors, issue, type ValidationIssue } from "@/lib/validation";
import type {
  Alternative,
  DifficultyRules,
  DistractorSpec,
  GenerateContext,
  GeneratedProblem,
  GenerationReport,
  ProblemFamily,
  ProblemPack,
  ProblemRequest,
  RecentSignature,
} from "./types";

const ALTERNATIVE_IDS = ["A", "B", "C", "D", "E", "F"];

export function representValue(value: number, rules: DifficultyRules): string {
  if (isInteger(value)) return String(Math.round(value));
  return formatFixed(value, rules.decimals);
}

export function isTooSimilar(
  candidate: RecentSignature,
  recent: readonly RecentSignature[],
  window = 6,
): boolean {
  const slice = recent.slice(0, window);
  for (const entry of slice) {
    if (entry.conceptId !== candidate.conceptId) continue;
    if (entry.familyId !== candidate.familyId) continue;
    if (entry.templateId === candidate.templateId) {
      const scale = Math.max(1, Math.abs(entry.magnitude), Math.abs(candidate.magnitude));
      if (Math.abs(entry.magnitude - candidate.magnitude) / scale < 0.05) return true;
    }
    if (
      candidate.context &&
      entry.context === candidate.context &&
      entry.familyId === candidate.familyId
    ) {
      const scale = Math.max(1, Math.abs(entry.magnitude), Math.abs(candidate.magnitude));
      if (Math.abs(entry.magnitude - candidate.magnitude) / scale < 0.35) return true;
    }
  }
  return false;
}

interface DistractorResult {
  specs: DistractorSpec[];
  issues: ValidationIssue[];
}

function normalizeDistractors(
  specs: DistractorSpec[],
  correctValue: number,
  wanted: number,
  rules: DifficultyRules,
): DistractorResult {
  const issues: ValidationIssue[] = [];
  const kept: DistractorSpec[] = [];
  for (const spec of specs) {
    if (!Number.isFinite(spec.value)) {
      issues.push(issue("distractor-nonfinite", `distractor ${spec.misconceptionId} is not finite`, "warning"));
      continue;
    }
    const scale = Math.max(1, Math.abs(spec.value), Math.abs(correctValue));
    const equalsAnswer = Math.abs(spec.value - correctValue) <= 1e-6 * scale;
    if (equalsAnswer) {
      issues.push(
        issue("distractor-equals-answer", `distractor ${spec.misconceptionId} equals the correct answer`, "warning"),
      );
      continue;
    }
    const duplicate = kept.some(
      (other) => Math.abs(other.value - spec.value) <= 1e-6 * Math.max(1, Math.abs(other.value), Math.abs(spec.value)),
    );
    if (duplicate) {
      issues.push(issue("distractor-duplicate", `distractor ${spec.misconceptionId} duplicated another value`, "warning"));
      continue;
    }
    const display = spec.display ?? representValue(spec.value, rules);
    const sameDisplay = kept.some(
      (other) => (other.display ?? representValue(other.value, rules)) === display,
    );
    if (sameDisplay) {
      issues.push(
        issue("distractor-ambiguous", `distractor ${spec.misconceptionId} renders as "${display}", same as another alternative`, "warning"),
      );
      continue;
    }
    kept.push({ ...spec, display });
  }

  if (kept.length < wanted) {
    issues.push(
      issue("distractor-shortage", `only ${kept.length} usable distractors (wanted ${wanted})`),
    );
  }

  return {
    specs: kept.slice(0, wanted).map((spec) => ({
      ...spec,
      display: spec.display ?? representValue(spec.value, rules),
    })),
    issues,
  };
}

function resolveAnswer(draftValue: number, display: string | undefined, rules: DifficultyRules) {
  if (display && !isInteger(draftValue)) {
    return { value: draftValue, display };
  }
  const value = isInteger(draftValue) ? draftValue : round(draftValue, rules.decimals);
  return { value, display: display ?? representValue(value, rules) };
}

export function generateFromPack(
  pack: ProblemPack,
  request: Omit<ProblemRequest, "conceptId"> & { conceptId?: string },
): GenerationReport {
  const conceptId = request.conceptId ?? pack.conceptId;
  const started = Date.now();
  const issues: ValidationIssue[] = [];
  const maxAttempts = Math.max(1, Math.min(request.maxAttempts ?? 60, 400));
  const seed = request.seed?.trim() || makeSeed(pack.seedPrefix);
  const rules = pack.difficultyRules[request.difficulty];
  const recent = request.recent ?? [];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptSeed = attempt === 0 ? seed : `${seed}~${attempt}`;
    const rng = createRng(attemptSeed);

    const families = pack.families.filter(
      (family) =>
        family.difficulties.includes(request.difficulty) &&
        (!request.familyId || family.id === request.familyId),
    );
    if (!families.length) {
      issues.push(issue("no-family", `no family available for ${request.difficulty}`));
      break;
    }
    const family = rng.pickWeighted(families, (f: ProblemFamily) => f.weight ?? 1);

    const templates = pack.templates.filter(
      (template) =>
        template.familyId === family.id &&
        template.difficulties.includes(request.difficulty) &&
        (!request.templateId || template.id === request.templateId),
    );
    if (!templates.length) {
      issues.push(issue("no-template", `no template for family ${family.id}`));
      continue;
    }
    const template = rng.pick(templates);

    const ctx: GenerateContext = {
      rng,
      seed: attemptSeed,
      conceptId,
      difficulty: request.difficulty,
      family,
      templateId: template.id,
    };

    const draft = template.build(ctx);
    if (!draft) {
      issues.push(issue("build-skipped", `${template.id} declined to build on attempt ${attempt}`, "warning"));
      continue;
    }

    if (isTooSimilar(draft.fingerprint, recent)) {
      issues.push(issue("repetition", `problem too similar to a recent one (${template.id})`, "warning"));
      continue;
    }

    const draftIssues = pack.validators.flatMap((validator) => validator(draft, ctx));
    if (hasErrors(draftIssues)) {
      issues.push(...draftIssues.map((i) => ({ ...i, detail: { ...i.detail, attempt } })));
      continue;
    }

    const answer = resolveAnswer(draft.answerValue, draft.answerDisplay, rules);

    const totalAlternatives =
      draft.answerKind === "boolean" ? 2 : (draft.alternativesCount ?? rules.alternatives);
    const wanted = Math.max(1, totalAlternatives - 1);
    const extra = pack.distractorGenerators.flatMap((generator) => generator(draft, ctx));
    const pool = [...draft.distractors];
    for (const spec of extra) {
      const scale = Math.max(1, Math.abs(spec.value));
      const exists = pool.some((p) => Math.abs(p.value - spec.value) <= 1e-6 * scale);
      if (!exists) pool.push(spec);
    }

    const normalized = normalizeDistractors(pool, answer.value, wanted, rules);
    const distractorErrors = normalized.issues.filter((i) => i.severity === "error");
    if (distractorErrors.length) {
      issues.push(...distractorErrors.map((i) => ({ ...i, detail: { ...i.detail, attempt } })));
      continue;
    }

    const alternatives: Alternative[] = rng
      .shuffle([...normalized.specs])
      .map((spec, index) => ({
        id: ALTERNATIVE_IDS[index],
        value: spec.value,
        display: spec.display ?? representValue(spec.value, rules),
        correct: false,
        misconceptionId: spec.misconceptionId,
        feedback: spec.feedback,
      }));

    const correctIndex = rng.int(0, alternatives.length);
    alternatives.splice(correctIndex, 0, {
      id: "",
      value: answer.value,
      display: answer.display,
      correct: true,
    });
    const finalAlternatives = alternatives.map((alt, index) => ({
      ...alt,
      id: ALTERNATIVE_IDS[index],
    }));

    const problem: GeneratedProblem = {
      id: `${attemptSeed}@${attempt}`,
      seed,
      conceptId,
      familyId: family.id,
      familyTitle: family.title,
      templateId: template.id,
      difficulty: request.difficulty,
      prompt: draft.prompt,
      ...(draft.context ? { context: draft.context } : {}),
      variables: draft.variables,
      diagram: draft.diagram ?? { kind: "none" },
      ...(draft.formula ? { formula: draft.formula } : {}),
      answer: {
        value: answer.value,
        display: answer.display,
        kind: draft.answerKind ?? "numeric",
        ...(draft.unit ? { unit: draft.unit } : {}),
      },
      ...(draft.unit ? { unit: draft.unit } : {}),
      alternatives: finalAlternatives,
      solutionSteps: draft.solutionSteps,
      misconceptions: pack.misconceptions,
      requiresPaper: request.difficulty === "avancada",
      metadata: {
        generatedAt: Date.now(),
        attempts: attempt + 1,
        latencyMs: Date.now() - started,
      },
    };

    return { problem, issues: [], attempts: attempt + 1 };
  }

  return { problem: null, issues, attempts: maxAttempts };
}

export function formatVariables(variables: Record<string, number | string>): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}=${typeof value === "number" ? formatNumber(value, 2) : value}`)
    .join(" ");
}
