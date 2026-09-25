import { formatNumber } from "@/lib/format";
import { classifyAngle } from "@/lib/geometry";
import type { DistractorSpec, GenerateContext, ProblemDraft, ProblemPack } from "../types";
import { geometricValidator, precisionValidatorFactory, promptValidator } from "./shared";

const ANGLE_CLASSES = ["agudo", "reto", "obtuso", "raso"] as const;
const CLASS_INDEX: Record<string, number> = {
  agudo: 0,
  reto: 1,
  obtuso: 2,
  raso: 3,
};
const CLASS_LABEL: Record<string, string> = {
  agudo: "Agudo",
  reto: "Reto",
  obtuso: "Obtuso",
  raso: "Raso",
};

const misconceptions = [
  {
    id: "ANG-CLASSIFY-BOUNDARY",
    title: "Confundiu a fronteira entre as classes",
    explanation:
      "A classificação depende da comparação com 90° e 180°. Menor que 90° é agudo; exatamente 90° é reto; entre 90° e 180° é obtuso; exatamente 180° é raso.",
    conceptHint: "explorar",
  },
  {
    id: "ANG-COMPLEMENT-CONFUSE",
    title: "Trocou complementar com suplementar",
    explanation:
      "Ângulos complementares somam 90°. Ângulos suplementares somam 180°. Identifique qual par o problema pede.",
    conceptHint: "entender",
  },
  {
    id: "ANG-ADDED-INSTEAD",
    title: "Somou em vez de subtrair",
    explanation:
      "Se dois ângulos somam 90° (ou 180°), o que falta é a diferença: 90° − x.",
    conceptHint: "entender",
  },
  {
    id: "ANG-360",
    title: "Usou 360°",
    explanation:
      "A volta completa tem 360°, mas pares complementares e suplementares usam 90° e 180°.",
    conceptHint: "entender",
  },
  {
    id: "ANG-BISECTOR",
    title: "Não dividiu pela bissetriz",
    explanation:
      "A bissetriz divide o ângulo em duas partes iguais: cada parte é metade do ângulo original.",
    conceptHint: "exemplos",
  },
  {
    id: "ANG-OPV",
    title: "Não usou opostos pelo vértice",
    explanation:
      "Ângulos opostos pelo vértice são iguais. Já os adjacentes na mesma reta são suplementares.",
    conceptHint: "entender",
  },
  {
    id: "ANG-NEAR",
    title: "Erro de aritmética",
    explanation: "O valor está próximo, mas a subtração não foi feita corretamente.",
    conceptHint: "exemplos",
  },
];

function degreePick(ctx: GenerateContext): number {
  const rng = ctx.rng;
  const d = ctx.difficulty;
  if (d === "leve") {
    const kind = rng.pick(["acute", "acute", "right", "obtuse", "obtuse", "straight"]);
    if (kind === "right") return 90;
    if (kind === "straight") return 180;
    if (kind === "acute") return rng.int(12, 82);
    return rng.int(95, 172);
  }
  if (d === "normal") {
    const kind = rng.pick(["acute", "right", "obtuse", "straight", "boundary"]);
    if (kind === "right") return 90;
    if (kind === "straight") return 180;
    if (kind === "boundary") return rng.pick([89, 91, 179]);
    if (kind === "acute") return rng.int(5, 88);
    return rng.int(92, 178);
  }
  return rng.pick([87, 88, 89, 91, 92, 93, 179, 178, 1, 2, 12.5, 44.5, 134.5]);
}

function buildClassify(ctx: GenerateContext): ProblemDraft | null {
  const degrees = degreePick(ctx);
  const klass = classifyAngle(degrees, 1);
  if (klass === "nulo") return null;
  const correctIndex = CLASS_INDEX[klass];
  const distractors: DistractorSpec[] = ANGLE_CLASSES.filter((k) => k !== klass).map((k) => ({
    value: CLASS_INDEX[k],
    display: CLASS_LABEL[k],
    misconceptionId: "ANG-CLASSIFY-BOUNDARY",
    feedback:
      klass === "reto" || k === "reto"
        ? "Noventa graus exatos formam o ângulo reto. Compare o valor com 90° e com 180°."
        : "Compare o valor com 90° e com 180° para escolher a classe correta.",
  }));
  const degreesDisplay = formatNumber(degrees);
  return {
    prompt: `Um ângulo mede ${degreesDisplay}°. Qual é a classificação desse ângulo?`,
    templateId: ctx.templateId,
    variables: { degrees, correctIndex, kind: "classify" },
    answerValue: correctIndex,
    answerDisplay: CLASS_LABEL[klass],
    alternativesCount: 4,
    diagram: { kind: "angle", degrees: Math.min(degrees, 350), label: `${degreesDisplay}°` },
    distractors,
    solutionSteps: [
      {
        expression: `${degreesDisplay}° ${
          degrees < 90 ? "< 90° → agudo" : degrees === 90 ? "= 90° → reto" : degrees < 180 ? "> 90° e < 180° → obtuso" : "= 180° → raso"
        }`,
      },
    ],
    fingerprint: {
      familyId: "classify",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: degrees,
    },
  };
}

function pairValue(ctx: GenerateContext, base: number): number {
  const d = ctx.difficulty;
  if (d === "leve") return ctx.rng.int(15, 75);
  return ctx.rng.pick([base / 2, base / 4, 1, 89, 91, 45, 60, 30, 120, 135]);
}

function buildComplement(ctx: GenerateContext): ProblemDraft | null {
  const given = pairValue(ctx, 90);
  if (!(given > 0 && given < 90)) return null;
  const answer = 90 - given;
  return {
    prompt: `Dois ângulos são complementares. Um deles mede ${formatNumber(given)}°. Qual é a medida do outro?`,
    templateId: ctx.templateId,
    variables: { given, answer, kind: "complement" },
    answerValue: answer,
    answerDisplay: `${formatNumber(answer)}°`,
    diagram: { kind: "angle", degrees: 90, label: "90°" },
    distractors: [
      {
        value: 180 - given,
        display: `${formatNumber(180 - given)}°`,
        misconceptionId: "ANG-COMPLEMENT-CONFUSE",
        feedback: "Você usou a soma 180°, que é o caso dos suplementares. Complementares somam 90°.",
      },
      {
        value: 90 + given,
        display: `${formatNumber(90 + given)}°`,
        misconceptionId: "ANG-ADDED-INSTEAD",
        feedback: "Some os dois ângulos e iguale a 90°. O que falta é uma subtração.",
      },
      {
        value: 360 - given,
        display: `${formatNumber(360 - given)}°`,
        misconceptionId: "ANG-360",
        feedback: "360° é a volta completa. Use 90° para complementares.",
      },
      {
        value: Math.max(1, answer + 2),
        display: `${formatNumber(Math.max(1, answer + 2))}°`,
        misconceptionId: "ANG-NEAR",
        feedback: `Reveja a subtração: 90° − ${formatNumber(given)}°.`,
      },
    ],
    solutionSteps: [
      { expression: `x + ${formatNumber(given)}° = 90°` },
      { expression: `x = 90° − ${formatNumber(given)}° = ${formatNumber(answer)}°` },
    ],
    fingerprint: {
      familyId: "complement",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: given,
    },
  };
}

function buildSupplement(ctx: GenerateContext): ProblemDraft | null {
  const given = ctx.difficulty === "leve" ? ctx.rng.int(20, 160) : ctx.rng.pick([15, 37, 45, 100, 110, 125, 138, 165, 171, 178]);
  if (!(given > 0 && given < 180)) return null;
  const answer = 180 - given;
  return {
    prompt: `Dois ângulos são suplementares. Um deles mede ${formatNumber(given)}°. Qual é a medida do outro?`,
    templateId: ctx.templateId,
    variables: { given, answer, kind: "supplement" },
    answerValue: answer,
    answerDisplay: `${formatNumber(answer)}°`,
    diagram: { kind: "angle", degrees: 180, label: "180°" },
    distractors: [
      {
        value: 90 - given > 0 ? 90 - given : 90,
        display: `${formatNumber(90 - given > 0 ? 90 - given : 90)}°`,
        misconceptionId: "ANG-COMPLEMENT-CONFUSE",
        feedback: "Você usou 90°, que é o caso dos complementares. Suplementares somam 180°.",
      },
      {
        value: 180 + given,
        display: `${formatNumber(180 + given)}°`,
        misconceptionId: "ANG-ADDED-INSTEAD",
        feedback: "Falta uma subtração: 180° − medida dada.",
      },
      {
        value: 360 - given,
        display: `${formatNumber(360 - given)}°`,
        misconceptionId: "ANG-360",
        feedback: "360° é a volta completa, não o par suplementar.",
      },
      {
        value: Math.abs(180 - given) - 10,
        display: `${formatNumber(Math.abs(180 - given) - 10)}°`,
        misconceptionId: "ANG-NEAR",
        feedback: `Reveja a subtração: 180° − ${formatNumber(given)}°.`,
      },
    ],
    solutionSteps: [
      { expression: `x + ${formatNumber(given)}° = 180°` },
      { expression: `x = 180° − ${formatNumber(given)}° = ${formatNumber(answer)}°` },
    ],
    fingerprint: {
      familyId: "supplement",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: given,
    },
  };
}

function buildAdjacent(ctx: GenerateContext): ProblemDraft | null {
  const given = ctx.rng.int(25, 140);
  const answer = 180 - given;
  return {
    prompt: `Na figura, os dois ângulos estão sobre uma mesma reta, formando um ângulo raso. Um deles mede ${formatNumber(given)}°. Qual é a medida do outro?`,
    templateId: ctx.templateId,
    variables: { given, answer, kind: "adjacent" },
    answerValue: answer,
    answerDisplay: `${formatNumber(answer)}°`,
    diagram: { kind: "angle", degrees: 180, label: `${formatNumber(given)}°` },
    distractors: [
      {
        value: given,
        display: `${formatNumber(given)}°`,
        misconceptionId: "ANG-OPV",
        feedback:
          "Ângulos iguais aparecem quando são opostos pelo vértice. Aqui os dois estão sobre a mesma reta: somam 180°.",
      },
      {
        value: 180 + given,
        display: `${formatNumber(180 + given)}°`,
        misconceptionId: "ANG-ADDED-INSTEAD",
        feedback: "Some os dois e iguale a 180°.",
      },
      {
        value: 90 - (given % 90),
        display: `${formatNumber(90 - (given % 90))}°`,
        misconceptionId: "ANG-COMPLEMENT-CONFUSE",
        feedback: "Aqui os dois ângulos formam 180°, não 90°.",
      },
      {
        value: Math.max(1, answer + 5),
        display: `${formatNumber(Math.max(1, answer + 5))}°`,
        misconceptionId: "ANG-NEAR",
        feedback: `Reveja a subtração: 180° − ${formatNumber(given)}°.`,
      },
    ],
    solutionSteps: [
      { expression: `x + ${formatNumber(given)}° = 180°` },
      { expression: `x = ${formatNumber(answer)}°` },
    ],
    fingerprint: {
      familyId: "adjacent",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: given,
    },
  };
}

function buildBisector(ctx: GenerateContext): ProblemDraft | null {
  const whole = ctx.rng.pick([48, 64, 76, 92, 108, 124, 136, 148, 172, 36, 54]);
  const half = whole / 2;
  const withComplement = ctx.rng.bool(0.45);
  const answer = withComplement ? 90 - half : half;
  if (answer <= 0) return null;
  return {
    prompt: withComplement
      ? `A bissetriz de um ângulo de ${formatNumber(whole)}° foi traçada. Qual é a medida do complemento de um dos ângulos formados?`
      : `A bissetriz de um ângulo de ${formatNumber(whole)}° foi traçada. Qual é a medida de cada ângulo formado?`,
    templateId: ctx.templateId,
    variables: { whole, half, answer, kind: "bisector" },
    answerValue: answer,
    answerDisplay: `${formatNumber(answer)}°`,
    diagram: { kind: "angle", degrees: whole, label: `${formatNumber(whole)}°` },
    distractors: [
      {
        value: whole,
        display: `${formatNumber(whole)}°`,
        misconceptionId: "ANG-BISECTOR",
        feedback: "A bissetriz divide o ângulo em duas partes iguais: cada parte é metade.",
      },
      {
        value: withComplement ? 180 - half : whole * 2,
        display: `${formatNumber(withComplement ? 180 - half : whole * 2)}°`,
        misconceptionId: withComplement ? "ANG-COMPLEMENT-CONFUSE" : "ANG-BISECTOR",
        feedback: withComplement
          ? "Complementares somam 90°, não 180°."
          : "Você dobrou o ângulo em vez de dividi-lo.",
      },
      {
        value: withComplement ? half : half / 2,
        display: `${formatNumber(withComplement ? half : half / 2)}°`,
        misconceptionId: withComplement ? "ANG-BISECTOR" : "ANG-BISECTOR",
        feedback: withComplement
          ? "Você parou no ângulo da bissetriz. Falta calcular o complemento."
          : "A bissetriz divide em duas partes iguais, não em quatro.",
      },
      {
        value: Math.max(1, answer + 3),
        display: `${formatNumber(Math.max(1, answer + 3))}°`,
        misconceptionId: "ANG-NEAR",
        feedback: "Revise as duas etapas: metade e depois o complemento.",
      },
    ],
    solutionSteps: withComplement
      ? [
          { expression: `bissetriz: ${formatNumber(whole)}° ÷ 2 = ${formatNumber(half)}°` },
          { expression: `complemento: 90° − ${formatNumber(half)}° = ${formatNumber(answer)}°` },
        ]
      : [
          { expression: `x = ${formatNumber(whole)}° ÷ 2` },
          { expression: `x = ${formatNumber(answer)}°` },
        ],
    fingerprint: {
      familyId: "bisector",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: whole,
    },
  };
}

export const anglesPack: ProblemPack = {
  conceptId: "geo-angles",
  seedPrefix: "GEO-ANG",
  families: [
    { id: "classify", title: "Classificar ângulos", description: "agudo, reto, obtuso, raso", difficulties: ["leve"] },
    { id: "complement", title: "Ângulos complementares", description: "soma 90°", difficulties: ["leve", "normal"], weight: 1.2 },
    { id: "supplement", title: "Ângulos suplementares", description: "soma 180°", difficulties: ["leve", "normal"], weight: 1.2 },
    { id: "adjacent", title: "Ângulos adjacentes", description: "ângulo raso dividido", difficulties: ["normal"] },
    { id: "bisector", title: "Bissetriz", description: "duas etapas", difficulties: ["avancada"], weight: 1.3 },
  ],
  templates: [
    { id: "ang-classify", familyId: "classify", difficulties: ["leve"], build: buildClassify },
    { id: "ang-complement", familyId: "complement", difficulties: ["leve", "normal"], build: buildComplement },
    { id: "ang-supplement", familyId: "supplement", difficulties: ["leve", "normal"], build: buildSupplement },
    { id: "ang-adjacent", familyId: "adjacent", difficulties: ["normal"], build: buildAdjacent },
    { id: "ang-bisector", familyId: "bisector", difficulties: ["avancada"], build: buildBisector },
  ],
  validators: [
    geometricValidator("ANG"),
    promptValidator,
    precisionValidatorFactory("ANG"),
    (draft) => {
      const issues = [];
      const kind = String(draft.variables.kind);
      if (kind !== "classify" && draft.answerValue <= 0) {
        issues.push({ code: "ANG-NONPOSITIVE", message: "angle must be positive", severity: "error" as const });
      }
      if (kind !== "classify" && draft.answerValue >= 180 && kind !== "supplement") {
        issues.push({ code: "ANG-RANGE", message: "angle out of expected range", severity: "error" as const });
      }
      return issues;
    },
  ],
  distractorGenerators: [],
  difficultyRules: {
    leve: { alternatives: 5, decimals: 1, allowRadical: false },
    normal: { alternatives: 5, decimals: 1, allowRadical: false },
    avancada: { alternatives: 5, decimals: 1, allowRadical: false },
  },
  misconceptions,
  defaultUnit: "°",
};

