import { describe, expect, it } from "vitest";
import { computeMastery, masteryLabel } from "@/engine/mastery";
import {
  EXPLORATION_XP_CAP,
  markExplored,
  recordAnswer,
  recordSignature,
  setStudent,
  startSession,
} from "@/engine/progress/store";
import { emptyConceptProgress, emptyProgress } from "@/engine/progress/types";
import { getPack } from "@/engine/problems/registry";
import { generateFromPack } from "@/engine/problems/engine";
import type { DifficultyId } from "@/engine/problems/types";

function problemFor(conceptId: string, difficulty: DifficultyId, seed: string) {
  const pack = getPack(conceptId)!;
  const report = generateFromPack(pack, { difficulty, seed });
  if (!report.problem) throw new Error("failed to generate problem for test");
  return report.problem;
}

describe("perfil e progresso", () => {
  it("guarda nome e ano", () => {
    const progress = setStudent(emptyProgress(), "  Marina ", 8);
    expect(progress.student?.name).toBe("Marina");
    expect(progress.student?.year).toBe(8);
  });

  it("concede XP de exploração no primeiro acesso e respeita o teto", () => {
    let progress = emptyProgress();
    for (let i = 0; i < 40; i++) {
      progress = markExplored(progress, `node-${i}`, "geo-pythagoras");
    }
    expect(progress.explored.length).toBe(40);
    expect(progress.xp).toBe(EXPLORATION_XP_CAP);
    expect(progress.explorationXp).toBe(EXPLORATION_XP_CAP);
  });

  it("não concede XP duas vezes pelo mesmo nó", () => {
    let progress = emptyProgress();
    progress = markExplored(progress, "geo-pythagoras", "geo-pythagoras");
    progress = markExplored(progress, "geo-pythagoras", "geo-pythagoras");
    expect(progress.xp).toBe(2);
  });
});

describe("registro de respostas", () => {
  it("acumula XP por dificuldade", () => {
    let progress = emptyProgress();
    progress = recordAnswer(progress, {
      problem: problemFor("geo-pythagoras", "leve", "GEO-PYT-A1"),
      correct: true,
    });
    expect(progress.xp).toBe(5);
    progress = recordAnswer(progress, {
      problem: problemFor("geo-pythagoras", "normal", "GEO-PYT-A2"),
      correct: true,
    });
    expect(progress.xp).toBe(15);
    progress = recordAnswer(progress, {
      problem: problemFor("geo-pythagoras", "avancada", "GEO-PYT-A3"),
      correct: true,
    });
    expect(progress.xp).toBe(30);
  });

  it("controla sequência e registra misconceptions", () => {
    let progress = emptyProgress();
    const problem = problemFor("geo-pythagoras", "normal", "GEO-PYT-B1");
    progress = recordAnswer(progress, { problem, correct: true });
    progress = recordAnswer(progress, { problem, correct: true });
    expect(progress.concepts[problem.conceptId].streak).toBe(2);
    expect(progress.concepts[problem.conceptId].bestStreak).toBe(2);

    progress = recordAnswer(progress, {
      problem,
      correct: false,
      misconceptionId: "PYT-SUM-LEGS",
    });
    expect(progress.concepts[problem.conceptId].streak).toBe(0);
    expect(progress.concepts[problem.conceptId].bestStreak).toBe(2);
    expect(progress.concepts[problem.conceptId].misconceptions["PYT-SUM-LEGS"]).toBe(1);
    expect(progress.xp).toBe(20);
  });

  it("conta sessões", () => {
    let progress = emptyProgress();
    progress = startSession(progress, "geo-area");
    progress = startSession(progress, "geo-area");
    expect(progress.concepts["geo-area"].sessions).toBe(2);
  });

  it("guarda assinaturas recentes sem duplicar", () => {
    let progress = emptyProgress();
    progress = recordSignature(progress, "geo-area", {
      familyId: "rectangle",
      templateId: "area-rect",
      magnitude: 10,
    });
    progress = recordSignature(progress, "geo-area", {
      familyId: "rectangle",
      templateId: "area-rect",
      magnitude: 12,
    });
    expect(progress.concepts["geo-area"].recent.length).toBe(1);
  });
});

describe("domínio", () => {
  it("é zero sem tentativas", () => {
    const mastery = computeMastery(undefined, 8);
    expect(mastery.overall).toBe(0);
    expect(masteryLabel(mastery.overall)).toBe("NÃO INICIADO");
  });

  it("não permite 100% apenas com questões fáceis", () => {
    const record = emptyConceptProgress("geo-pythagoras");
    record.byDifficulty.leve.attempts = 40;
    record.byDifficulty.leve.correct = 40;
    record.byDifficulty.leve.families = { triples: { attempts: 40, correct: 40 } };
    const mastery = computeMastery(record, 8);
    expect(mastery.overall).toBeLessThan(60);
    expect(mastery.nextStep).toContain("NORMAL");
  });

  it("cresce com dificuldade e diversidade", () => {
    const record = emptyConceptProgress("geo-pythagoras");
    for (const [difficulty, correct] of [
      ["leve", 6],
      ["normal", 6],
      ["avancada", 6],
    ] as Array<[DifficultyId, number]>) {
      record.byDifficulty[difficulty].attempts = correct;
      record.byDifficulty[difficulty].correct = correct;
      record.byDifficulty[difficulty].families = {
        "find-hypotenuse": { attempts: 2, correct: 2 },
        "find-leg": { attempts: 2, correct: 2 },
        triples: { attempts: 2, correct: 2 },
        context: { attempts: 2, correct: 2 },
        decimals: { attempts: 2, correct: 2 },
        diagram: { attempts: 2, correct: 2 },
      };
    }
    record.recent = Array.from({ length: 8 }, () => ({
      familyId: "find-hypotenuse",
      templateId: "pyt-hyp",
      conceptId: "geo-pythagoras",
      magnitude: 0,
    }));
    const mastery = computeMastery(record, 8);
    expect(mastery.overall).toBeGreaterThan(90);
    expect(mastery.overall).toBeLessThanOrEqual(100);
    expect(mastery.diversity).toBe(1);
  });

  it("é menor quando há erros", () => {
    const perfect = emptyConceptProgress("geo-area");
    const messy = emptyConceptProgress("geo-area");
    for (const difficulty of ["leve", "normal", "avancada"] as DifficultyId[]) {
      perfect.byDifficulty[difficulty].attempts = 10;
      perfect.byDifficulty[difficulty].correct = 10;
      messy.byDifficulty[difficulty].attempts = 10;
      messy.byDifficulty[difficulty].correct = 4;
    }
    expect(computeMastery(perfect, 6).overall).toBeGreaterThan(
      computeMastery(messy, 6).overall,
    );
  });
});
