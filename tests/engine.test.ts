import { describe, expect, it } from "vitest";
import { createRng, makeSeed } from "@/lib/random";
import { formatNumber, formatRadical, radical, round } from "@/lib/format";
import { uniqueNumbers } from "@/lib/validation";
import { getPack, PROBLEM_PACKS } from "@/engine/problems/registry";
import { generateFromPack, isTooSimilar } from "@/engine/problems/engine";
import { DIFFICULTIES, type GeneratedProblem } from "@/engine/problems/types";

function strip(problem: GeneratedProblem) {
  return {
    seed: problem.seed,
    prompt: problem.prompt,
    familyId: problem.familyId,
    templateId: problem.templateId,
    answer: problem.answer,
    alternatives: problem.alternatives.map((alt) => ({
      id: alt.id,
      display: alt.display,
      correct: alt.correct,
      misconceptionId: alt.misconceptionId,
    })),
    diagram: problem.diagram,
  };
}

describe("aleatoriedade determinística", () => {
  it("reproduz a mesma sequência para a mesma seed", () => {
    const a = createRng("GEO-PYT-8F3K2");
    const b = createRng("GEO-PYT-8F3K2");
    const first = Array.from({ length: 20 }, () => a.next());
    const second = Array.from({ length: 20 }, () => b.next());
    expect(first).toEqual(second);
  });

  it("produz sequências diferentes para seeds diferentes", () => {
    const a = createRng("GEO-PYT-AAAAA");
    const b = createRng("GEO-PYT-BBBBB");
    expect(a.next()).not.toBe(b.next());
  });

  it("respeita os limites de int", () => {
    const rng = createRng("bounds");
    for (let i = 0; i < 200; i++) {
      const value = rng.int(3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("gera seeds com prefixo", () => {
    const seed = makeSeed("GEO-PYT");
    expect(seed.startsWith("GEO-PYT-")).toBe(true);
    expect(seed.length).toBe("GEO-PYT-".length + 5);
  });
});

describe("formatação numérica", () => {
  it("formata inteiros e decimais", () => {
    expect(formatNumber(10)).toBe("10");
    expect(formatNumber(3.6055, 2)).toBe("3.61");
    expect(formatNumber(2.5)).toBe("2.5");
    expect(round(3.6055, 2)).toBe(3.61);
  });

  it("produz radicais exatos", () => {
    expect(formatRadical(25)).toBe("5");
    expect(radical(52)).toEqual({ outside: 2, inside: 13 });
    expect(formatRadical(52)).toBe("2√13");
    expect(formatRadical(13)).toBe("√13");
  });

  it("detecta duplicatas numéricas", () => {
    expect(uniqueNumbers([1, 2, 3])).toBe(true);
    expect(uniqueNumbers([1, 2, 2])).toBe(false);
    expect(uniqueNumbers([1, 1.0000001], 1e-3)).toBe(false);
  });
});

describe("motor de problemas", () => {
  it("reproduz exatamente o mesmo problema para a mesma seed", () => {
    const pack = getPack("geo-pythagoras")!;
    const first = generateFromPack(pack, { difficulty: "normal", seed: "GEO-PYT-001" });
    const second = generateFromPack(pack, { difficulty: "normal", seed: "GEO-PYT-001" });
    expect(first.problem).not.toBeNull();
    expect(strip(first.problem!)).toEqual(strip(second.problem!));
  });

  it("gera problemas diferentes para seeds diferentes", () => {
    const pack = getPack("geo-pythagoras")!;
    const prompts = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const report = generateFromPack(pack, { difficulty: "normal", seed: `GEO-PYT-S${i}` });
      if (report.problem) prompts.add(report.problem.prompt);
    }
    expect(prompts.size).toBeGreaterThan(6);
  });

  it("rejeita problemas muito parecidos com os recentes", () => {
    const signature = {
      familyId: "find-hypotenuse",
      templateId: "pyt-hyp",
      conceptId: "geo-pythagoras",
      magnitude: 100,
    };
    expect(isTooSimilar(signature, [{ ...signature, magnitude: 101 }])).toBe(true);
    expect(isTooSimilar(signature, [{ ...signature, magnitude: 400 }])).toBe(false);
    expect(isTooSimilar(signature, [])).toBe(false);
  });

  it("nunca repete a mesma questão em sequência", () => {
    const pack = getPack("geo-area")!;
    const recent: Array<{ familyId: string; templateId: string; conceptId: string; magnitude: number }> = [];
    let previous: string | null = null;
    for (let i = 0; i < 40; i++) {
      const report = generateFromPack(pack, { difficulty: "normal", recent: [...recent] });
      expect(report.problem).not.toBeNull();
      const problem = report.problem!;
      expect(problem.prompt).not.toBe(previous);
      previous = problem.prompt;
      recent.unshift({
        familyId: problem.familyId,
        templateId: problem.templateId,
        conceptId: problem.conceptId,
        magnitude: 0,
      });
      recent.length = Math.min(recent.length, 6);
    }
  });
});

describe.each(Object.keys(PROBLEM_PACKS))("pack %s", (conceptId) => {
  const pack = PROBLEM_PACKS[conceptId];

  it.each(DIFFICULTIES)("gera problemas válidos em %s", (difficulty) => {
    const usable = pack.families.some((family) => family.difficulties.includes(difficulty));
    if (!usable) return;

    const recent: Array<{ familyId: string; templateId: string; conceptId: string; magnitude: number }> = [];
    let generated = 0;

    for (let i = 0; i < 160; i++) {
      const report = generateFromPack(pack, {
        difficulty,
        seed: `${pack.seedPrefix}-T${i}`,
        recent: [...recent],
      });
      expect(report.problem, `seed ${pack.seedPrefix}-T${i}: ${report.issues
        .map((issue) => issue.message)
        .join(" | ")}`).not.toBeNull();

      const problem = report.problem!;
      generated += 1;

      expect(Number.isFinite(problem.answer.value)).toBe(true);
      expect(problem.answer.value).toBeGreaterThanOrEqual(0);
      expect(problem.prompt.length).toBeGreaterThan(18);
      expect(problem.alternatives.length).toBeGreaterThanOrEqual(2);

      const correct = problem.alternatives.filter((alt) => alt.correct);
      expect(correct).toHaveLength(1);
      expect(correct[0].display).toBe(problem.answer.display);

      expect(uniqueNumbers(problem.alternatives.map((alt) => alt.value), 1e-9)).toBe(true);
      const displays = problem.alternatives.map((alt) => alt.display);
      expect(new Set(displays).size).toBe(displays.length);

      for (const alternative of problem.alternatives) {
        expect(Number.isFinite(alternative.value)).toBe(true);
        if (alternative.correct) continue;
        const scale = Math.max(1, Math.abs(alternative.value), Math.abs(problem.answer.value));
        expect(Math.abs(alternative.value - problem.answer.value)).toBeGreaterThan(1e-6 * scale);
        expect(alternative.misconceptionId).toBeTruthy();
        expect(alternative.feedback && alternative.feedback.length).toBeTruthy();
      }

      expect(pack.misconceptions.length).toBeGreaterThan(0);

      recent.unshift({
        familyId: problem.familyId,
        templateId: problem.templateId,
        conceptId: problem.conceptId,
        magnitude: 0,
      });
      recent.length = Math.min(recent.length, 6);
    }

    expect(generated).toBe(160);
  });
});

describe("acurácia matemática do pack de Pitágoras", () => {
  const pack = getPack("geo-pythagoras")!;

  it("mantém a e a b coerentes com a resposta", () => {
    for (let i = 0; i < 200; i++) {
      const report = generateFromPack(pack, {
        difficulty: "normal",
        seed: `GEO-PYT-M${i}`,
        familyId: "find-hypotenuse",
      });
      if (!report.problem) continue;
      const { a, b, c } = report.problem.variables as {
        a: number;
        b: number;
        c: number;
      };
      expect(Math.hypot(a, b)).toBeCloseTo(c, 8);
      expect(report.problem.answer.value).toBeCloseTo(c, 8);
    }
  });

  it("mantém c e o cateto conhecido coerentes no cateto que falta", () => {
    for (let i = 0; i < 200; i++) {
      const report = generateFromPack(pack, {
        difficulty: "normal",
        seed: `GEO-PYT-L${i}`,
        familyId: "find-leg",
      });
      if (!report.problem) continue;
      const { c, knownLeg, unknown } = report.problem.variables as {
        c: number;
        knownLeg: number;
        unknown: number;
      };
      expect(Math.hypot(unknown, knownLeg)).toBeCloseTo(c, 8);
      expect(report.problem.answer.value).toBeCloseTo(unknown, 8);
    }
  });
});
