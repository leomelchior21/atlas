import { formatNumber, isInteger } from "@/lib/format";
import { triangleInequality } from "@/lib/geometry";
import type { DistractorSpec, GenerateContext, ProblemDraft, ProblemPack } from "../types";
import { geometricValidator, precisionValidatorFactory, promptValidator } from "./shared";

const SIDE_CLASSES = ["Equilátero", "Isósceles", "Escaleno"];
const ANGLE_CLASSES = ["Acutângulo", "Retângulo", "Obtusângulo"];

const misconceptions = [
  {
    id: "TRI-SUM-180",
    title: "Esqueceu que a soma é 180°",
    explanation:
      "Em qualquer triângulo, a soma dos três ângulos internos é 180°. Se dois são conhecidos, o terceiro é 180° menos a soma deles.",
    conceptHint: "entender",
  },
  {
    id: "TRI-SUM-360",
    title: "Usou 360°",
    explanation: "360° é a soma dos ângulos de um quadrilátero, não de um triângulo.",
    conceptHint: "entender",
  },
  {
    id: "TRI-CLASS-ANGLE",
    title: "Confundiu a classificação",
    explanation:
      "Acutângulo: três ângulos agudos. Retângulo: um ângulo de 90°. Obtusângulo: um ângulo maior que 90°.",
    conceptHint: "explorar",
  },
  {
    id: "TRI-CLASS-SIDE",
    title: "Confundiu a classificação pelos lados",
    explanation:
      "Equilátero: três lados iguais. Isósceles: dois lados iguais. Escaleno: três lados diferentes.",
    conceptHint: "explorar",
  },
  {
    id: "TRI-ISOSCELES-BASE",
    title: "Esqueceu que os ângulos da base são iguais",
    explanation:
      "No triângulo isósceles, os ângulos da base são iguais. Se o ângulo do vértice é V, cada ângulo da base é (180° − V) ÷ 2.",
    conceptHint: "entender",
  },
  {
    id: "TRI-EXTERIOR",
    title: "Erro no ângulo externo",
    explanation:
      "O ângulo externo é igual à soma dos dois ângulos internos não adjacentes (ou 180° menos o interno adjacente).",
    conceptHint: "entender",
  },
  {
    id: "TRI-INEQUALITY",
    title: "Não aplicou a desigualdade triangular",
    explanation:
      "Para formar um triângulo, a soma de dois lados deve ser maior que o terceiro. Basta testar o maior lado.",
    conceptHint: "entender",
  },
  {
    id: "TRI-NEAR",
    title: "Erro de aritmética",
    explanation: "A resposta está próxima, mas a conta não está exata.",
    conceptHint: "exemplos",
  },
];

function buildClassifySides(ctx: GenerateContext): ProblemDraft | null {
  const rng = ctx.rng;
  const kind = rng.pick(["equilatero", "isosceles", "escaleno", "escaleno"]);
  let sides: [number, number, number];
  if (kind === "equilatero") {
    const s = rng.int(3, 15);
    sides = [s, s, s];
  } else if (kind === "isosceles") {
    const s = rng.int(4, 18);
    let base = rng.int(3, 20);
    if (base === s) base += 1;
    if (!triangleInequality(s, s, base)) return null;
    sides = [s, s, base];
  } else {
    let a = rng.int(4, 20);
    let b = rng.int(4, 20);
    let c = rng.int(4, 20);
    if (a === b || b === c || a === c) return null;
    if (!triangleInequality(a, b, c)) return null;
    sides = [a, b, c];
  }
  const klass =
    sides[0] === sides[1] && sides[1] === sides[2]
      ? "Equilátero"
      : sides[0] === sides[1] || sides[1] === sides[2] || sides[0] === sides[2]
        ? "Isósceles"
        : "Escaleno";
  const correctIndex = SIDE_CLASSES.indexOf(klass);
  const distractors: DistractorSpec[] = SIDE_CLASSES.filter((k) => k !== klass).map((k) => ({
    value: SIDE_CLASSES.indexOf(k),
    display: k,
    misconceptionId: "TRI-CLASS-SIDE",
    feedback:
      klass === "Equilátero"
        ? "Os três lados são iguais."
        : klass === "Isósceles"
          ? "Exatamente dois lados são iguais."
          : "Os três lados são diferentes.",
  }));
  return {
    prompt: `Um triângulo tem lados medindo ${sides.map((s) => formatNumber(s)).join(" cm, ")} cm. Como esse triângulo é classificado quanto aos lados?`,
    templateId: ctx.templateId,
    variables: { ...Object.fromEntries(sides.map((s, i) => [`s${i}`, s])), kind: "classify-sides" },
    answerValue: correctIndex,
    answerDisplay: klass,
    alternativesCount: 3,
    diagram: {
      kind: "triangle-sides",
      sides,
      labels: sides.map((s) => `${formatNumber(s)} cm`) as [string, string, string],
    },
    distractors,
    solutionSteps: [
      { expression: `lados: ${sides.map((s) => formatNumber(s)).join(", ")}` },
      { expression: `${klass} — ${klass === "Equilátero" ? "três lados iguais" : klass === "Isósceles" ? "dois lados iguais" : "três lados diferentes"}` },
    ],
    fingerprint: {
      familyId: "classify-sides",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: sides[0] + sides[1] + sides[2],
    },
  };
}

function buildAngleSum(ctx: GenerateContext): ProblemDraft | null {
  const a = ctx.rng.int(25, 110);
  const b = ctx.rng.int(20, 180 - a - 15);
  const c = 180 - a - b;
  if (c <= 5) return null;
  return {
    prompt: `Dois ângulos internos de um triângulo medem ${formatNumber(a)}° e ${formatNumber(b)}°. Qual é a medida do terceiro ângulo?`,
    templateId: ctx.templateId,
    variables: { a, b, c, kind: "angle-sum" },
    answerValue: c,
    answerDisplay: `${formatNumber(c)}°`,
    diagram: { kind: "triangle-sides", sides: [40, 40, 40], labels: [`${formatNumber(a)}°`, `${formatNumber(b)}°`, "x"] },
    formula: ctx.difficulty === "leve" ? "a + b + c = 180°" : undefined,
    distractors: [
      {
        value: 180 - a,
        misconceptionId: "TRI-SUM-180",
        feedback: `Você subtraiu apenas ${formatNumber(a)}° de 180°. Subtraia a soma dos dois ângulos: ${formatNumber(a + b)}°.`,
      },
      {
        value: 360 - a - b,
        misconceptionId: "TRI-SUM-360",
        feedback: "A soma dos ângulos internos de um triângulo é 180°, não 360°.",
      },
      {
        value: a + b,
        misconceptionId: "TRI-SUM-180",
        feedback: "Você somou os dois ângulos. O que o problema pede é o que falta para 180°.",
      },
      {
        value: Math.max(1, 180 - a - b + 10),
        misconceptionId: "TRI-NEAR",
        feedback: `Revise a subtração: 180° − (${formatNumber(a)}° + ${formatNumber(b)}°).`,
      },
    ],
    solutionSteps: [
      { expression: `a + b + c = 180°` },
      { expression: `c = 180° − (${formatNumber(a)}° + ${formatNumber(b)}°)` },
      { expression: `c = 180° − ${formatNumber(a + b)}° = ${formatNumber(c)}°` },
    ],
    fingerprint: { familyId: "angle-sum", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: a + b },
  };
}

function buildClassifyAngles(ctx: GenerateContext): ProblemDraft | null {
  const kind = ctx.rng.pick(["acutangulo", "retangulo", "obtusangulo"]);
  let a: number;
  let b: number;
  let c: number;
  if (kind === "retangulo") {
    a = 90;
    b = ctx.rng.int(20, 70);
    c = 180 - a - b;
  } else if (kind === "obtusangulo") {
    a = ctx.rng.int(95, 145);
    b = ctx.rng.int(10, 180 - a - 10);
    c = 180 - a - b;
  } else {
    a = ctx.rng.int(35, 80);
    b = ctx.rng.int(Math.max(25, 180 - a - 89), 85);
    c = 180 - a - b;
    if (c >= 90 || c <= 5 || a >= 90 || b >= 90) return null;
  }
  if (c <= 4) return null;
  const klass = a === 90 || b === 90 || c === 90 ? "Retângulo" : Math.max(a, b, c) > 90 ? "Obtusângulo" : "Acutângulo";
  const correctIndex = ANGLE_CLASSES.indexOf(klass);
  const distractors: DistractorSpec[] = ANGLE_CLASSES.filter((k) => k !== klass).map((k) => ({
    value: ANGLE_CLASSES.indexOf(k),
    display: k,
    misconceptionId: "TRI-CLASS-ANGLE",
    feedback:
      kind === "retangulo"
        ? "Um dos ângulos mede exatamente 90°."
        : kind === "obtusangulo"
          ? "Um dos ângulos é maior que 90°."
          : "Os três ângulos são menores que 90°.",
  }));
  return {
    prompt: `Um triângulo tem ângulos internos medindo ${formatNumber(a)}°, ${formatNumber(b)}° e ${formatNumber(c)}°. Como esse triângulo é classificado quanto aos ângulos?`,
    templateId: ctx.templateId,
    variables: { a, b, c, kind: "classify-angles" },
    answerValue: correctIndex,
    answerDisplay: klass,
    alternativesCount: 3,
    diagram: { kind: "triangle-sides", sides: [40, 40, 40], labels: [`${formatNumber(a)}°`, `${formatNumber(b)}°`, `${formatNumber(c)}°`] },
    distractors,
    solutionSteps: [
      { expression: `maior ângulo: ${formatNumber(Math.max(a, b, c))}°` },
      { expression: `${klass} — ${klass === "Retângulo" ? "tem um ângulo de 90°" : klass === "Obtusângulo" ? "tem um ângulo maior que 90°" : "todos os ângulos são menores que 90°"}` },
    ],
    fingerprint: { familyId: "classify-angles", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: Math.max(a, b, c) },
  };
}

function buildIsosceles(ctx: GenerateContext): ProblemDraft | null {
  const apex = ctx.rng.pick([30, 40, 50, 60, 70, 80, 100, 110, 120, 140]);
  const base = (180 - apex) / 2;
  if (!isInteger(base)) return null;
  return {
    prompt: `Em um triângulo isósceles, o ângulo do vértice mede ${formatNumber(apex)}°. Qual é a medida de cada ângulo da base?`,
    templateId: ctx.templateId,
    variables: { apex, base, kind: "isosceles" },
    answerValue: base,
    answerDisplay: `${formatNumber(base)}°`,
    diagram: { kind: "triangle-sides", sides: [50, 50, 40], labels: [`${formatNumber(apex)}°`, "x", "x"] },
    distractors: [
      {
        value: 180 - apex,
        misconceptionId: "TRI-ISOSCELES-BASE",
        feedback: "180° menos o vértice dá a soma dos dois ângulos da base. Falta dividir por 2.",
      },
      {
        value: (180 - apex) / 2 + apex / 2,
        misconceptionId: "TRI-ISOSCELES-BASE",
        feedback: "Os dois ângulos da base são iguais entre si: cada um é (180° − vértice) ÷ 2.",
      },
      {
        value: apex,
        misconceptionId: "TRI-ISOSCELES-BASE",
        feedback: "Os ângulos da base não são iguais ao ângulo do vértice." },
      {
        value: Math.max(1, (180 - apex) / 2 + 5),
        misconceptionId: "TRI-NEAR",
        feedback: `Revise: (180° − ${formatNumber(apex)}°) ÷ 2.`,
      },
    ],
    solutionSteps: [
      { expression: `vértice + 2 × base = 180°` },
      { expression: `2 × base = 180° − ${formatNumber(apex)}° = ${formatNumber(180 - apex)}°` },
      { expression: `base = ${formatNumber(base)}°` },
    ],
    fingerprint: { familyId: "isosceles", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: apex },
  };
}

function buildExterior(ctx: GenerateContext): ProblemDraft | null {
  const a = ctx.rng.int(30, 100);
  const b = ctx.rng.int(25, 180 - a - 15);
  const exterior = a + b;
  const interior = 180 - exterior;
  if (interior <= 5) return null;
  return {
    prompt: `Em um triângulo, dois ângulos internos não adjacentes a um vértice medem ${formatNumber(a)}° e ${formatNumber(b)}°. Qual é a medida do ângulo externo nesse vértice?`,
    templateId: ctx.templateId,
    variables: { a, b, exterior, interior, kind: "exterior" },
    answerValue: exterior,
    answerDisplay: `${formatNumber(exterior)}°`,
    distractors: [
      {
        value: interior,
        display: `${formatNumber(interior)}°`,
        misconceptionId: "TRI-EXTERIOR",
        feedback: `Você calculou o ângulo interno (${formatNumber(interior)}°). O externo é o que falta para 180°, junto ao interno, e vale ${formatNumber(exterior)}°.`,
      },
      {
        value: 180 - a,
        display: `${formatNumber(180 - a)}°`,
        misconceptionId: "TRI-EXTERIOR",
        feedback: "O ângulo externo é a soma dos dois internos não adjacentes.",
      },
      {
        value: 360 - exterior,
        display: `${formatNumber(360 - exterior)}°`,
        misconceptionId: "TRI-SUM-360",
        feedback: "360° não participa dessa relação.",
      },
      {
        value: Math.max(1, exterior + 8),
        display: `${formatNumber(Math.max(1, exterior + 8))}°`,
        misconceptionId: "TRI-NEAR",
        feedback: `Some os dois ângulos dados: ${formatNumber(a)}° + ${formatNumber(b)}°.`,
      },
    ],
    solutionSteps: [
      { expression: `ângulo externo = soma dos internos não adjacentes` },
      { expression: `x = ${formatNumber(a)}° + ${formatNumber(b)}° = ${formatNumber(exterior)}°` },
    ],
    fingerprint: { familyId: "exterior", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: a + b },
  };
}

function buildInequality(ctx: GenerateContext): ProblemDraft | null {
  const possible = ctx.rng.bool(0.5);
  let sides: [number, number, number];
  if (possible) {
    do {
      sides = [ctx.rng.int(3, 18), ctx.rng.int(3, 18), ctx.rng.int(3, 18)];
    } while (!triangleInequality(sides[0], sides[1], sides[2]));
  } else {
    const big = ctx.rng.int(10, 25);
    const small1 = ctx.rng.int(2, 9);
    const small2 = ctx.rng.int(2, 9);
    if (small1 + small2 > big) return null;
    sides = [big, small1, small2];
  }
  const answerValue = possible ? 1 : 0;
  return {
    prompt: `É possível construir um triângulo com lados medindo ${sides.map((s) => formatNumber(s)).join(" cm, ")} cm?`,
    templateId: ctx.templateId,
    variables: { ...Object.fromEntries(sides.map((s, i) => [`s${i}`, s])), kind: "inequality", possible: answerValue },
    answerValue,
    answerDisplay: possible ? "Sim" : "Não",
    answerKind: "boolean",
    diagram: { kind: "triangle-sides", sides, labels: sides.map((s) => `${formatNumber(s)} cm`) as [string, string, string] },
    distractors: [
      {
        value: possible ? 0 : 1,
        display: possible ? "Não" : "Sim",
        misconceptionId: "TRI-INEQUALITY",
        feedback: possible
          ? "Teste: a soma dos dois menores lados é maior que o maior lado."
          : "Teste: a soma dos dois menores lados precisa ser maior que o maior lado.",
      },
    ],
    solutionSteps: [
      { expression: `maior lado: ${formatNumber(Math.max(...sides))} cm` },
      { expression: `soma dos outros dois: ${formatNumber(sides.reduce((s, v) => s + v, 0) - Math.max(...sides))} cm` },
      {
        expression: possible
          ? `${formatNumber(sides.reduce((s, v) => s + v, 0) - Math.max(...sides))} > ${formatNumber(Math.max(...sides))} → é possível`
          : `${formatNumber(sides.reduce((s, v) => s + v, 0) - Math.max(...sides))} ≤ ${formatNumber(Math.max(...sides))} → não é possível`,
      },
    ],
    fingerprint: { familyId: "inequality", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: sides[0] + sides[1] + sides[2] },
  };
}

function buildRatio(ctx: GenerateContext): ProblemDraft | null {
  const ratios = ctx.rng.pick([
    [1, 2, 3],
    [2, 3, 4],
    [1, 1, 2],
    [3, 4, 5],
    [1, 3, 5],
  ]);
  const parts = ratios[0] + ratios[1] + ratios[2];
  const unit = 180 / parts;
  if (!isInteger(unit)) return null;
  const angles = ratios.map((r) => r * unit);
  const largest = Math.max(...angles);
  const askLargest = ctx.rng.bool(0.55);
  const answer = askLargest ? largest : angles[0];
  const label = askLargest ? "maior ângulo" : "menor ângulo";
  return {
    prompt: `Em um triângulo, os ângulos internos estão na razão ${ratios.join(" : ")}. Qual é a medida do ${label}?`,
    templateId: ctx.templateId,
    variables: { ...Object.fromEntries(angles.map((a, i) => [`a${i}`, a])), parts, unit, answer, kind: "ratio" },
    answerValue: answer,
    answerDisplay: `${formatNumber(answer)}°`,
    diagram: { kind: "triangle-sides", sides: [40, 40, 40], labels: [`${ratios[0]}k`, `${ratios[1]}k`, `${ratios[2]}k`] },
    distractors: [
      {
        value: unit,
        display: `${formatNumber(unit)}°`,
        misconceptionId: "TRI-EXTERIOR",
        feedback: "Você encontrou o valor de uma parte (k). Multiplique pela razão pedida.",
      },
      {
        value: largest - unit,
        display: `${formatNumber(largest - unit)}°`,
        misconceptionId: "TRI-NEAR",
        feedback: "Revise a multiplicação pela razão.",
      },
      {
        value: 180 / parts + answer,
        display: `${formatNumber(180 / parts + answer)}°`,
        misconceptionId: "TRI-SUM-180",
        feedback: "Some as partes da razão e divida 180° por esse total. Depois multiplique.",
      },
      {
        value: Math.max(1, answer + 10),
        display: `${formatNumber(Math.max(1, answer + 10))}°`,
        misconceptionId: "TRI-NEAR",
        feedback: `Total das partes: ${parts}. Cada parte vale 180° ÷ ${parts} = ${formatNumber(unit)}°.`,
      },
    ],
    solutionSteps: [
      { expression: `soma das partes: ${ratios.join(" + ")} = ${parts}` },
      { expression: `cada parte: 180° ÷ ${parts} = ${formatNumber(unit)}°` },
      { expression: `${label}: ${ratios[askLargest ? ratios.indexOf(Math.max(...ratios)) : 0]} × ${formatNumber(unit)}° = ${formatNumber(answer)}°` },
    ],
    fingerprint: { familyId: "ratio", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: parts * 100 + answer },
  };
}

export const trianglesPack: ProblemPack = {
  conceptId: "geo-triangles",
  seedPrefix: "GEO-TRI",
  families: [
    { id: "classify-sides", title: "Classificação pelos lados", description: "equilátero, isósceles, escaleno", difficulties: ["leve"], weight: 1.2 },
    { id: "angle-sum", title: "Soma dos ângulos", description: "terceiro ângulo", difficulties: ["leve", "normal"], weight: 1.5 },
    { id: "classify-angles", title: "Classificação pelos ângulos", description: "acutângulo, retângulo, obtusângulo", difficulties: ["normal"], weight: 1.1 },
    { id: "isosceles", title: "Triângulo isósceles", description: "ângulos da base", difficulties: ["normal"], weight: 1.1 },
    { id: "exterior", title: "Ângulo externo", description: "soma dos internos não adjacentes", difficulties: ["normal"], weight: 1 },
    { id: "inequality", title: "Desigualdade triangular", description: "é possível construir?", difficulties: ["normal"], weight: 0.9 },
    { id: "ratio", title: "Ângulos em razão", description: "duas etapas", difficulties: ["avancada"], weight: 1.2 },
  ],
  templates: [
    { id: "tri-class-sides", familyId: "classify-sides", difficulties: ["leve"], build: buildClassifySides },
    { id: "tri-angle-sum", familyId: "angle-sum", difficulties: ["leve", "normal"], build: buildAngleSum },
    { id: "tri-class-angles", familyId: "classify-angles", difficulties: ["normal"], build: buildClassifyAngles },
    { id: "tri-isosceles", familyId: "isosceles", difficulties: ["normal"], build: buildIsosceles },
    { id: "tri-exterior", familyId: "exterior", difficulties: ["normal"], build: buildExterior },
    { id: "tri-inequality", familyId: "inequality", difficulties: ["normal"], build: buildInequality },
    { id: "tri-ratio", familyId: "ratio", difficulties: ["avancada"], build: buildRatio },
  ],
  validators: [geometricValidator("TRI"), promptValidator, precisionValidatorFactory("TRI")],
  distractorGenerators: [],
  difficultyRules: {
    leve: { alternatives: 5, decimals: 1, allowRadical: false },
    normal: { alternatives: 5, decimals: 1, allowRadical: false },
    avancada: { alternatives: 5, decimals: 1, allowRadical: false },
  },
  misconceptions,
  defaultUnit: "°",
};
