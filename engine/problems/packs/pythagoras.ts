import { formatNumber, formatRadical, isInteger, round } from "@/lib/format";
import type { Rng } from "@/lib/random";
import { issue, type ValidationIssue } from "@/lib/validation";
import {
  isRightTriangle,
  missingLeg,
  pythagoreanHypotenuse,
  triangleInequality,
  nearlyEqual,
} from "@/lib/geometry";
import type {
  DifficultyId,
  DistractorSpec,
  DraftValidator,
  GenerateContext,
  ProblemDraft,
  ProblemPack,
} from "../types";

export const pythagorasMisconceptions = [
  {
    id: "PYT-SUM-LEGS",
    title: "Somou os catetos",
    explanation:
      "Você somou a e b diretamente. A hipotenusa não é a soma dos catetos: é a raiz da soma dos quadrados.",
    conceptHint: "explorar",
  },
  {
    id: "PYT-NO-SQRT",
    title: "Esqueceu a raiz",
    explanation:
      "Você calculou a² + b² mas parou antes de extrair a raiz quadrada. Falta o último passo: √(a² + b²).",
    conceptHint: "entender",
  },
  {
    id: "PYT-SQRT-FIRST",
    title: "Aplicou a raiz antes de somar",
    explanation:
      "Você tirou a raiz de a e de b antes de somar. A ordem correta é: primeiro elevar ao quadrado, depois somar, e só então extrair a raiz.",
    conceptHint: "entender",
  },
  {
    id: "PYT-ADD-INSTEAD-SUBTRACT",
    title: "Somou em vez de subtrair",
    explanation:
      "Para achar um cateto, a hipotenusa é que entra sozinha: b² = c² − a². Você somou os quadrados.",
    conceptHint: "entender",
  },
  {
    id: "PYT-SUBTRACT-NO-SQUARE",
    title: "Subtraiu os comprimentos",
    explanation:
      "Você subtraiu os comprimentos antes de elevar ao quadrado. A relação vale entre as áreas: c² − a².",
    conceptHint: "explorar",
  },
  {
    id: "PYT-WRONG-HYPOTENUSE",
    title: "Trocou a hipotenusa",
    explanation:
      "A hipotenusa é sempre o maior lado e fica oposta ao ângulo reto. Verifique quem é c antes de aplicar o teorema.",
    conceptHint: "explorar",
  },
  {
    id: "PYT-PERIMETER",
    title: "Calculou o perímetro",
    explanation:
      "Você somou os três lados do triângulo. Isso é o perímetro, não a hipotenusa.",
    conceptHint: "comparar",
  },
  {
    id: "PYT-UNIT",
    title: "Ignorou a conversão de unidades",
    explanation:
      "Os lados estavam em unidades diferentes. Converta tudo para a mesma unidade antes de aplicar o teorema.",
    conceptHint: "explorar",
  },
  {
    id: "PYT-AREA-DOUBLE",
    title: "Não dividiu por 2",
    explanation:
      "Você usou cateto × cateto. A área do triângulo é metade do produto dos catetos (ou metade de base × altura).",
    conceptHint: "exemplos",
  },
  {
    id: "PYT-NOT-RIGHT",
    title: "Confundiu a condição",
    explanation:
      "Em um triângulo retângulo vale a igualdade a² + b² = c². Se o maior lado ao quadrado for diferente da soma dos quadrados dos outros dois, o triângulo não é retângulo.",
    conceptHint: "entender",
  },
  {
    id: "PYT-NEAR-MISS",
    title: "Comparou apenas o maior lado",
    explanation:
      "Não basta comparar o maior lado. É preciso comparar o quadrado do maior lado com a soma dos quadrados dos outros dois.",
    conceptHint: "entender",
  },
];

const TRIPLES: Array<[number, number, number]> = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [6, 8, 10],
  [9, 12, 15],
  [12, 16, 20],
  [10, 24, 26],
  [15, 20, 25],
  [9, 40, 41],
  [20, 21, 29],
  [12, 35, 37],
  [16, 30, 34],
  [18, 24, 30],
  [14, 48, 50],
];

const hyp = (a: number, b: number) => pythagoreanHypotenuse(a, b);

function roundingHint(exact: boolean): string {
  return exact ? "" : " Use duas casas decimais.";
}

function radicalDisplay(radicand: number): string {
  return formatRadical(round(radicand, 6));
}

/* ------------------------------------------------------------- contexts */

interface ContextChoice {
  key: string;
  text: (v: { a: number; b: number; c: number; unit: string }) => string;
  solveFor: "a" | "b" | "c";
  unit: string;
  labelA: string;
  labelB: string;
  labelC: string;
}

const CONTEXTS: ContextChoice[] = [
  {
    key: "ladder",
    solveFor: "a",
    unit: "m",
    labelA: "h",
    labelB: "d",
    labelC: "escada",
    text: ({ a, b, c, unit }) =>
      `Uma escada de ${formatNumber(c)} ${unit} está apoiada em uma parede. A base da escada está a ${formatNumber(b)} ${unit} da parede. A que altura da parede a escada toca? (Use duas casas decimais quando necessário.)`,
  },
  {
    key: "screen",
    solveFor: "c",
    unit: "cm",
    labelA: "altura",
    labelB: "largura",
    labelC: "diagonal",
    text: ({ a, b, unit }) =>
      `Uma tela retangular tem ${formatNumber(a)} ${unit} de altura e ${formatNumber(b)} ${unit} de largura. Qual é a medida da diagonal da tela?`,
  },
  {
    key: "path",
    solveFor: "c",
    unit: "km",
    labelA: "norte",
    labelB: "leste",
    labelC: "linha reta",
    text: ({ a, b, unit }) =>
      `Um ciclista percorre ${formatNumber(a)} ${unit} para o norte e depois ${formatNumber(b)} ${unit} para o leste. Qual é a distância em linha reta entre o ponto de partida e o ponto de chegada?`,
  },
  {
    key: "ramp",
    solveFor: "c",
    unit: "m",
    labelA: "desnível",
    labelB: "horizontal",
    labelC: "rampa",
    text: ({ a, b, unit }) =>
      `Uma rampa vence um desnível de ${formatNumber(a)} ${unit} com ${formatNumber(b)} ${unit} de projeção horizontal. Qual é o comprimento da rampa?`,
  },
  {
    key: "roof",
    solveFor: "b",
    unit: "m",
    labelA: "altura",
    labelB: "base",
    labelC: "caibro",
    text: ({ a, c, unit }) =>
      `Um telhado tem ${formatNumber(a)} ${unit} de altura e cada caibro mede ${formatNumber(c)} ${unit}. Qual é a distância horizontal da base até o ponto onde o caibro toca o telhado?`,
  },
];

/* ------------------------------------------------------------- number sets */

function pickTriple(rng: Rng, difficulty: DifficultyId): [number, number, number] {
  const pool =
    difficulty === "leve"
      ? TRIPLES.slice(0, 5)
      : difficulty === "normal"
        ? TRIPLES.slice(0, 10)
        : TRIPLES;
  const [a, b, c] = rng.pick(pool);
  const scaler = difficulty === "leve" ? 1 : rng.pick([1, 1, 2]);
  return [a * scaler, b * scaler, c * scaler];
}

interface Legs {
  a: number;
  b: number;
  c: number;
  exact: boolean;
}

function legsFor(rng: Rng, difficulty: DifficultyId): Legs {
  if (difficulty === "leve") {
    if (rng.bool(0.72)) {
      const [a, b, c] = pickTriple(rng, "leve");
      return { a, b, c, exact: true };
    }
    const a = rng.int(3, 9);
    const b = rng.int(3, 9);
    return { a, b, c: hyp(a, b), exact: isInteger(hyp(a, b)) };
  }

  if (difficulty === "normal") {
    if (rng.bool(0.45)) {
      const [a, b, c] = pickTriple(rng, "normal");
      return { a, b, c, exact: true };
    }
    const a = rng.int(4, 16);
    const b = rng.int(4, 16);
    return { a, b, c: hyp(a, b), exact: isInteger(hyp(a, b)) };
  }

  if (rng.bool(0.4)) {
    const [a, b, c] = pickTriple(rng, "avancada");
    return { a, b, c, exact: true };
  }
  const a = rng.int(9, 30);
  const b = rng.int(9, 30);
  return { a, b, c: hyp(a, b), exact: isInteger(hyp(a, b)) };
}

/* ------------------------------------------------------------- templates */

function buildFindHypotenuse(ctx: GenerateContext): ProblemDraft | null {
  const { a, b, c } = legsFor(ctx.rng, ctx.difficulty);
  if (triangleInequality(a, b, c) === false) return null;
  const exact = isInteger(c);
  const base =
    ctx.templateId === "pyt-diagram"
      ? `No triângulo retângulo ao lado, os catetos medem ${formatNumber(a)} cm e ${formatNumber(b)} cm. Qual é a medida da hipotenusa?`
      : `Em um triângulo retângulo os catetos medem ${formatNumber(a)} cm e ${formatNumber(b)} cm. Determine a medida da hipotenusa.`;
  const prompt = base + roundingHint(exact);
  return {
    prompt,
    templateId: ctx.templateId,
    variables: { a, b, c, solveFor: "c", exact: exact ? 1 : 0, kind: "hypotenuse" },
    diagram: {
      kind: "right-triangle",
      legA: a,
      legB: b,
      labelA: formatNumber(a),
      labelB: formatNumber(b),
      labelC: "x",
      orientation: ctx.rng.bool(0.5) ? "left" : "right",
    },
    formula: ctx.difficulty === "leve" ? "a² + b² = c²" : undefined,
    answerValue: c,
    answerDisplay: exact ? formatNumber(c) : formatNumber(c, 2),
    unit: "cm",
    solutionSteps: [
      { expression: `c² = ${formatNumber(a)}² + ${formatNumber(b)}²` },
      { expression: `c² = ${formatNumber(a * a)} + ${formatNumber(b * b)}` },
      { expression: `c² = ${formatNumber(a * a + b * b)}` },
      {
        expression: `c = √${formatNumber(a * a + b * b)} = ${exact ? formatNumber(c) : formatNumber(c, 2)}`,
        note: exact ? "raiz exata" : "valor aproximado com duas casas decimais",
      },
    ],
    distractors: [],
    fingerprint: {
      familyId: "find-hypotenuse",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: a + b,
    },
  };
}

function buildMissingLeg(ctx: GenerateContext): ProblemDraft | null {
  const { a, b, c } = legsFor(ctx.rng, ctx.difficulty);
  const rng = ctx.rng;
  const knownLeg = rng.bool(0.5) ? a : b;
  const unknown = a + b - knownLeg;
  if (!(c > knownLeg)) return null;
  const solved = missingLeg(c, knownLeg);
  if (!Number.isFinite(solved) || solved <= 0) return null;
  const exact = isInteger(solved);
  const unknownIsA = nearlyEqual(unknown, a);
  return {
    prompt:
      `Em um triângulo retângulo a hipotenusa mede ${formatNumber(c)} cm e um dos catetos mede ${formatNumber(knownLeg)} cm. Qual é a medida do outro cateto?` +
      roundingHint(exact),
    templateId: ctx.templateId,
    variables: {
      a,
      b,
      c,
      knownLeg,
      unknown,
      solveFor: unknownIsA ? "a" : "b",
      kind: "leg",
    },
    diagram: {
      kind: "right-triangle",
      legA: a,
      legB: b,
      labelA: unknownIsA ? "x" : formatNumber(a),
      labelB: unknownIsA ? formatNumber(b) : "x",
      labelC: formatNumber(c),
      orientation: "left",
    },
    formula: ctx.difficulty === "leve" ? "a² + b² = c²" : undefined,
    answerValue: solved,
    answerDisplay: exact ? formatNumber(solved) : formatNumber(solved, 2),
    unit: "cm",
    solutionSteps: [
      { expression: `${formatNumber(unknown)}² + ${formatNumber(knownLeg)}² = ${formatNumber(c)}²` },
      { expression: `${formatNumber(unknown)}² = ${formatNumber(c * c)} − ${formatNumber(knownLeg * knownLeg)}` },
      { expression: `${formatNumber(unknown)}² = ${formatNumber(c * c - knownLeg * knownLeg)}` },
      {
        expression: `${formatNumber(unknown)} = √${formatNumber(c * c - knownLeg * knownLeg)} = ${exact ? formatNumber(solved) : formatNumber(solved, 2)}`,
      },
    ],
    distractors: [],
    fingerprint: {
      familyId: "find-leg",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: c + knownLeg,
    },
  };
}

function buildTripleRecognition(ctx: GenerateContext): ProblemDraft | null {
  const [a, b, c] = pickTriple(ctx.rng, ctx.difficulty === "leve" ? "leve" : "normal");
  const unit = ctx.rng.pick(["cm", "m"]);
  return {
    prompt: `Os catetos de um triângulo retângulo medem ${formatNumber(a)} ${unit} e ${formatNumber(b)} ${unit}. Reconheça um terno pitagórico e determine a hipotenusa.`,
    templateId: ctx.templateId,
    variables: { a, b, c, solveFor: "c", exact: 1, kind: "triple" },
    diagram: {
      kind: "right-triangle",
      legA: a,
      legB: b,
      labelA: formatNumber(a),
      labelB: formatNumber(b),
      labelC: "x",
      orientation: "right",
    },
    answerValue: c,
    answerDisplay: formatNumber(c),
    unit,
    solutionSteps: [
      { expression: `${formatNumber(a)}² + ${formatNumber(b)}² = ${formatNumber(a * a)} + ${formatNumber(b * b)}` },
      { expression: `= ${formatNumber(a * a + b * b)} = ${formatNumber(c)}²` },
      { expression: `c = ${formatNumber(c)}`, note: `terno pitagórico (${a}, ${b}, ${c})` },
    ],
    distractors: [],
    fingerprint: {
      familyId: "triples",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: a + b,
    },
  };
}

function buildTripleRadical(ctx: GenerateContext): ProblemDraft | null {
  const rng = ctx.rng;
  const a = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12]);
  const sum = a * a + b * b;
  if (isInteger(Math.sqrt(sum))) return null;
  const root = Math.sqrt(sum);
  const unit = "cm";
  const wrongRadicalValue = (delta: number) => {
    const candidate = sum + delta;
    return candidate > 1 ? candidate : sum + Math.abs(delta) + 1;
  };
  return {
    prompt: `Um quadrado tem lado ${formatNumber(a)} cm. Outro quadrado tem lado ${formatNumber(b)} cm. As duas áreas somadas formam a área de um quadrado de lado x. Determine x em forma de radical exato.`,
    templateId: ctx.templateId,
    variables: { a, b, sum, solveFor: "c", exact: 0, kind: "triple-radical" },
    diagram: {
      kind: "right-triangle",
      legA: a,
      legB: b,
      labelA: formatNumber(a),
      labelB: formatNumber(b),
      labelC: "x",
      orientation: "left",
    },
    answerValue: root,
    answerDisplay: radicalDisplay(sum),
    unit,
    solutionSteps: [
      { expression: `x² = ${formatNumber(a)}² + ${formatNumber(b)}² = ${formatNumber(a * a)} + ${formatNumber(b * b)} = ${formatNumber(sum)}` },
      { expression: `x = √${formatNumber(sum)}`, note: "não há raiz exata: a resposta fica na forma de radical" },
    ],
    distractors: [
      {
        value: Math.sqrt(wrongRadicalValue(2)),
        display: `√${formatNumber(wrongRadicalValue(2))}`,
        misconceptionId: "PYT-SUM-LEGS",
        feedback: "Você somou os lados antes de elevar ao quadrado. Some as áreas primeiro.",
      },
      {
        value: Math.sqrt(wrongRadicalValue(-2)),
        display: `√${formatNumber(wrongRadicalValue(-2))}`,
        misconceptionId: "PYT-SQRT-FIRST",
        feedback: "A soma correta é a² + b², não o valor vizinho.",
      },
      {
        value: a + b,
        display: formatNumber(a + b),
        misconceptionId: "PYT-SQRT-FIRST",
        feedback: `Você usou ${formatNumber(a)} + ${formatNumber(b)}. Somar os lados não é o mesmo que somar as áreas.`,
      },
      {
        value: sum,
        display: formatNumber(sum),
        misconceptionId: "PYT-NO-SQRT",
        feedback: `Você chegou em x² = ${formatNumber(sum)} mas não extraiu a raiz.`,
      },
      {
        value: Math.sqrt(sum) * 2,
        display: formatNumber(Math.sqrt(sum) * 2, 2),
        misconceptionId: "PYT-PERIMETER",
        feedback: "Você duplicou o lado. A diagonal de um quadrado não é o dobro do lado.",
      },
    ],
    fingerprint: {
      familyId: "triples",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: a + b,
    },
  };
}

function buildDecimals(ctx: GenerateContext): ProblemDraft | null {
  const rng = ctx.rng;
  const [a0, b0, c0] = rng.pick(TRIPLES.slice(0, 6));
  const factor = rng.pick([0.1, 0.2, 0.5, 0.25]);
  const a = round(a0 * factor, 4);
  const b = round(b0 * factor, 4);
  const c = round(c0 * factor, 4);
  const unit = rng.pick(["m", "cm", "km"]);
  const solveHyp = rng.bool(0.6);
  if (solveHyp) {
    return {
      prompt: `Um terreno retangular tem ${formatNumber(a)} ${unit} por ${formatNumber(b)} ${unit}. Qual é o comprimento da diagonal?`,
      templateId: ctx.templateId,
      variables: { a, b, c, solveFor: "c", kind: "decimals" },
      diagram: {
        kind: "rectangle",
        width: b,
        height: a,
        labelWidth: formatNumber(b),
        labelHeight: formatNumber(a),
        labelDiagonal: "x",
        diagonal: true,
      },
      answerValue: c,
      answerDisplay: formatNumber(c),
      unit,
      solutionSteps: [
        { expression: `x² = ${formatNumber(a)}² + ${formatNumber(b)}²` },
        { expression: `x² = ${formatNumber(round(a * a, 6))} + ${formatNumber(round(b * b, 6))} = ${formatNumber(round(a * a + b * b, 6))}` },
        { expression: `x = ${formatNumber(c)}` },
      ],
      distractors: [
        {
          value: round(a + b, 4),
          misconceptionId: "PYT-SUM-LEGS",
          feedback: "Você somou os lados. A diagonal é a raiz da soma dos quadrados.",
        },
        {
          value: round(a * a + b * b, 4),
          misconceptionId: "PYT-NO-SQRT",
          feedback: "Você calculou o quadrado da diagonal e não extraiu a raiz.",
        },
        {
          value: round(Math.sqrt(a + b), 4),
          misconceptionId: "PYT-SQRT-FIRST",
          feedback: "Primeiro eleve ao quadrado, depois some, e só então tire a raiz.",
        },
        {
          value: round(a * b, 4),
          misconceptionId: "PYT-AREA-DOUBLE",
          feedback: "Esse é o valor da área do retângulo, não da diagonal.",
        },
      ],
      fingerprint: {
        familyId: "decimals",
        templateId: ctx.templateId,
        conceptId: ctx.conceptId,
        magnitude: a + b,
      },
    };
  }
  const known = rng.bool(0.5) ? a : b;
  const other = round(known === a ? b : a, 4);
  const solved = round(missingLeg(c, known), 4);
  return {
    prompt: `Uma escada de ${formatNumber(c)} ${unit} está encostada em um muro. A base da escada está a ${formatNumber(known)} ${unit} do muro. A que altura do muro a escada toca?`,
    templateId: ctx.templateId,
    variables: { a, b, c, knownLeg: known, unknown: other, solveFor: "b", kind: "decimals-leg" },
    diagram: {
      kind: "right-triangle",
      legA: other,
      legB: known,
      labelA: "x",
      labelB: formatNumber(known),
      labelC: formatNumber(c),
      orientation: "left",
      caption: "escada, muro e chão formam um triângulo retângulo",
    },
    answerValue: solved,
    answerDisplay: formatNumber(solved),
    unit,
    solutionSteps: [
      { expression: `x² + ${formatNumber(known)}² = ${formatNumber(c)}²` },
      { expression: `x² = ${formatNumber(round(c * c, 6))} − ${formatNumber(round(known * known, 6))} = ${formatNumber(round(c * c - known * known, 6))}` },
      { expression: `x = ${formatNumber(solved)}` },
    ],
    distractors: [
      {
        value: round(Math.sqrt(c * c + known * known), 4),
        misconceptionId: "PYT-ADD-INSTEAD-SUBTRACT",
        feedback: "Para achar um cateto você subtrai: x² = c² − a².",
      },
      {
        value: round(c * c - known * known, 4),
        misconceptionId: "PYT-NO-SQRT",
        feedback: "Você encontrou x² e parou. Falta extrair a raiz quadrada.",
      },
      {
        value: round(Math.max(0, c - known), 4),
        misconceptionId: "PYT-SUBTRACT-NO-SQUARE",
        feedback: "Subtrair os comprimentos não funciona: as áreas é que se subtraem.",
      },
      {
        value: round(c + known, 4),
        misconceptionId: "PYT-PERIMETER",
        feedback: "Você somou dois lados. Isso não é a altura procurada.",
      },
    ],
    fingerprint: {
      familyId: "decimals",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: c + known,
    },
  };
}

function buildContext(ctx: GenerateContext): ProblemDraft | null {
  const rng = ctx.rng;
  const { a, b, c } = legsFor(rng, ctx.difficulty === "avancada" ? "normal" : ctx.difficulty);
  const spec = rng.pick(CONTEXTS);
  const exact = isInteger(c);
  const values = { a, b, c, unit: spec.unit };
  const solved =
    spec.solveFor === "c" ? c : spec.solveFor === "a" ? a : b;
  const labelA = spec.solveFor === "a" ? "x" : formatNumber(a);
  const labelB = spec.solveFor === "b" ? "x" : formatNumber(b);
  const labelC = spec.solveFor === "c" ? "x" : formatNumber(c);
  return {
    prompt: spec.text(values) + roundingHint(exact),
    templateId: `${ctx.templateId}:${spec.key}`,
    context: spec.key,
    variables: {
      a,
      b,
      c,
      solveFor: spec.solveFor,
      exact: exact ? 1 : 0,
      kind: "context",
      context: spec.key,
    },
    diagram: {
      kind: "right-triangle",
      legA: a,
      legB: b,
      labelA,
      labelB,
      labelC,
      orientation: spec.key === "roof" ? "right" : "left",
    },
    answerValue: solved,
    answerDisplay:
      isInteger(solved) ? formatNumber(solved) : formatNumber(solved, 2),
    unit: spec.unit,
    solutionSteps: [
      {
        expression:
          spec.solveFor === "c"
            ? `x² = ${formatNumber(a)}² + ${formatNumber(b)}²`
            : `x² + ${formatNumber(spec.solveFor === "a" ? b : a)}² = ${formatNumber(c)}²`,
      },
      {
        expression: `x = ${isInteger(solved) ? formatNumber(solved) : formatNumber(solved, 2)}`,
      },
    ],
    distractors: [],
    fingerprint: {
      familyId: "context",
      templateId: `${ctx.templateId}:${spec.key}`,
      conceptId: ctx.conceptId,
      context: spec.key,
      magnitude: a + b,
    },
  };
}

function buildRightOrNot(ctx: GenerateContext): ProblemDraft | null {
  const rng = ctx.rng;
  const isRight = rng.bool(0.5);
  const [a0, b0, c0] = pickTriple(rng, ctx.difficulty === "avancada" ? "normal" : "leve");
  let sides: [number, number, number];
  let answerValue: number;
  if (isRight) {
    sides = [a0, b0, c0];
    answerValue = 1;
  } else {
    const delta = rng.pick([1, 1, 2, -1, -2]);
    const broken = Math.max(2, c0 + delta);
    if (broken === c0) return null;
    sides = [a0, b0, broken];
    answerValue = 0;
  }
  const [x, y, z] = sides;
  const largest = Math.max(x, y, z);
  const rest = x + y + z - largest;
  return {
    prompt: `Um triângulo tem lados medindo ${formatNumber(x)} cm, ${formatNumber(y)} cm e ${formatNumber(z)} cm. Esse triângulo é retângulo?`,
    templateId: ctx.templateId,
    variables: {
      a: x,
      b: y,
      c: z,
      largest,
      rest,
      isRight: answerValue,
      kind: "right-or-not",
    },
    answerValue,
    answerDisplay: answerValue === 1 ? "Sim" : "Não",
    answerKind: "boolean",
    diagram: {
      kind: "triangle-sides",
      sides: [x, y, z],
      labels: [formatNumber(x), formatNumber(y), formatNumber(z)],
    },
    solutionSteps: [
      {
        expression: `maior lado: ${formatNumber(largest)} → ${formatNumber(largest)}² = ${formatNumber(largest * largest)}`,
      },
      {
        expression: `soma dos outros: ${formatNumber(x + y + z - largest)} → ${formatNumber(x * x + y * y + z * z - largest * largest)}`,
      },
      {
        expression:
          answerValue === 1
            ? `${formatNumber(largest * largest)} = ${formatNumber(x * x + y * y + z * z - largest * largest)} → é retângulo`
            : `${formatNumber(largest * largest)} ≠ ${formatNumber(x * x + y * y + z * z - largest * largest)} → não é retângulo`,
      },
    ],
    distractors: [
      {
        value: answerValue === 1 ? 0 : 1,
        display: answerValue === 1 ? "Não" : "Sim",
        misconceptionId: "PYT-NEAR-MISS",
        feedback:
          "Compare o quadrado do maior lado com a soma dos quadrados dos outros dois lados.",
      },
    ],
    fingerprint: {
      familyId: "right-or-not",
      templateId: ctx.templateId,
      conceptId: ctx.conceptId,
      magnitude: x + y + z,
    },
  };
}

function buildMultiStep(ctx: GenerateContext): ProblemDraft | null {
  const rng = ctx.rng;
  const mode = rng.pick(["perimeter-diagonal", "area-after-leg", "unit-conversion"]);

  if (mode === "perimeter-diagonal") {
    const [a, b, c] = pickTriple(rng, "normal");
    const perimeter = 2 * (a + b);
    return {
      prompt: `Um retângulo tem perímetro ${formatNumber(perimeter)} cm e um dos lados mede ${formatNumber(a)} cm. Qual é o comprimento da diagonal?`,
      templateId: `${ctx.templateId}:perimeter-diagonal`,
      context: "perimeter-diagonal",
      variables: { a, b, c, perimeter, solveFor: "diagonal", kind: "multi" },
      diagram: {
        kind: "rectangle",
        width: b,
        height: a,
        labelWidth: formatNumber(b),
        labelHeight: formatNumber(a),
        labelDiagonal: "x",
        diagonal: true,
      },
      answerValue: c,
      answerDisplay: formatNumber(c),
      unit: "cm",
      solutionSteps: [
        { expression: `semiperímetro = ${formatNumber(perimeter)} ÷ 2 = ${formatNumber(a + b)}` },
        { expression: `outro lado = ${formatNumber(a + b)} − ${formatNumber(a)} = ${formatNumber(b)}` },
        { expression: `x² = ${formatNumber(a)}² + ${formatNumber(b)}² = ${formatNumber(a * a + b * b)}` },
        { expression: `x = ${formatNumber(c)}` },
      ],
      distractors: [
        {
          value: perimeter - a,
          misconceptionId: "PYT-PERIMETER",
          feedback: `Você usou o perímetro menos um lado. O outro lado é metade do perímetro menos ${formatNumber(a)}.`,
        },
        {
          value: round(Math.sqrt((perimeter / 2) ** 2 + a * a), 4),
          misconceptionId: "PYT-SUM-LEGS",
          feedback: "Você usou o semiperímetro como se fosse um lado. Encontre o lado que falta primeiro.",
        },
        {
          value: round(hyp(a, perimeter / 2), 4),
          misconceptionId: "PYT-WRONG-HYPOTENUSE",
          feedback: "Um dos valores usados não é um lado do retângulo.",
        },
        {
          value: a + b + c,
          display: formatNumber(a + b + c),
          misconceptionId: "PYT-PERIMETER",
          feedback: "Você calculou a soma dos lados do triângulo, não a diagonal.",
        },
      ],
      fingerprint: {
        familyId: "multi-step",
        templateId: `${ctx.templateId}:perimeter-diagonal`,
        conceptId: ctx.conceptId,
        context: "perimeter-diagonal",
        magnitude: perimeter,
      },
    };
  }

  if (mode === "area-after-leg") {
    const [a, b, c] = pickTriple(rng, "normal");
    const area = (a * b) / 2;
    return {
      prompt: `Um triângulo retângulo tem hipotenusa ${formatNumber(c)} cm e um cateto de ${formatNumber(a)} cm. Qual é a área desse triângulo?`,
      templateId: `${ctx.templateId}:area-after-leg`,
      context: "area-after-leg",
      variables: { a, b, c, area, solveFor: "area", kind: "multi" },
      diagram: {
        kind: "right-triangle",
        legA: a,
        legB: b,
        labelA: formatNumber(a),
        labelB: "h",
        labelC: formatNumber(c),
        orientation: "left",
      },
      answerValue: area,
      answerDisplay: formatNumber(area),
      unit: "cm²",
      solutionSteps: [
        { expression: `h² = ${formatNumber(c)}² − ${formatNumber(a)}² = ${formatNumber(c * c - a * a)}` },
        { expression: `h = ${formatNumber(b)}` },
        { expression: `área = (${formatNumber(a)} × ${formatNumber(b)}) ÷ 2 = ${formatNumber(area)}` },
      ],
      distractors: [
        {
          value: a * b,
          misconceptionId: "PYT-AREA-DOUBLE",
          feedback: "Você esqueceu de dividir por 2. A área do triângulo é metade do produto dos catetos.",
        },
        {
          value: (a * c) / 2,
          misconceptionId: "PYT-WRONG-HYPOTENUSE",
          feedback: "Você usou a hipotenusa como se fosse um cateto. A hipotenusa não é base nem altura.",
        },
        {
          value: area * 2 + a,
          misconceptionId: "PYT-ADD-INSTEAD-SUBTRACT",
          feedback: "O cateto que falta não foi calculado corretamente.",
        },
        {
          value: round(area / 2, 4),
          misconceptionId: "PYT-AREA-DOUBLE",
          feedback: "Foi dividido por 2 duas vezes.",
        },
      ],
      fingerprint: {
        familyId: "multi-step",
        templateId: `${ctx.templateId}:area-after-leg`,
        conceptId: ctx.conceptId,
        context: "area-after-leg",
        magnitude: c + a,
      },
    };
  }

  const [a, b, c] = pickTriple(rng, "normal");
  const aCm = a * 100;
  return {
    prompt: `Uma rampa tem ${formatNumber(aCm)} cm de desnível e ${formatNumber(b)} m de projeção horizontal. Qual é o comprimento da rampa, em metros?`,
    templateId: `${ctx.templateId}:unit-conversion`,
    context: "unit-conversion",
    variables: { a: aCm, b, c, solveFor: "c", kind: "multi" },
    diagram: {
      kind: "right-triangle",
      legA: aCm / 100,
      legB: b,
      labelA: `${formatNumber(aCm)} cm`,
      labelB: `${formatNumber(b)} m`,
      labelC: "x",
      orientation: "left",
    },
    answerValue: c,
    answerDisplay: formatNumber(c),
    unit: "m",
    solutionSteps: [
      { expression: `${formatNumber(aCm)} cm = ${formatNumber(a)} m`, note: "converta tudo para metros antes de aplicar o teorema" },
      { expression: `x² = ${formatNumber(a)}² + ${formatNumber(b)}² = ${formatNumber(a * a + b * b)}` },
      { expression: `x = ${formatNumber(c)} m` },
    ],
    distractors: [
      {
        value: round(hyp(aCm, b), 4),
        misconceptionId: "PYT-UNIT",
        feedback: `Você usou ${formatNumber(aCm)} e ${formatNumber(b)} na mesma conta. Converta ${formatNumber(aCm)} cm para metros.`,
      },
      {
        value: round(hyp(aCm, b) / 100, 4),
        misconceptionId: "PYT-UNIT",
        feedback: "A conversão foi feita depois do cálculo; converta antes.",
      },
      {
        value: aCm + b,
        misconceptionId: "PYT-SUM-LEGS",
        feedback: "Some os quadrados, não os lados.",
      },
      {
        value: round(a + b, 4),
        misconceptionId: "PYT-NO-SQRT",
        feedback: "Você converteu corretamente mas não aplicou o teorema.",
      },
    ],
    fingerprint: {
      familyId: "multi-step",
      templateId: `${ctx.templateId}:unit-conversion`,
      conceptId: ctx.conceptId,
      context: "unit-conversion",
      magnitude: aCm + b,
    },
  };
}

/* ------------------------------------------------------- distractor engine */

function distractorsForHypotenuse(draft: ProblemDraft): DistractorSpec[] {
  const a = Number(draft.variables.a);
  const b = Number(draft.variables.b);
  const c = Number(draft.variables.c);
  const out: DistractorSpec[] = [
    {
      value: a + b,
      misconceptionId: "PYT-SUM-LEGS",
      feedback: `Você somou os catetos: ${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(a + b)}. A hipotenusa é maior que qualquer cateto, mas não é a soma deles.`,
    },
    {
      value: a * a + b * b,
      misconceptionId: "PYT-NO-SQRT",
      feedback: `Você chegou em c² = ${formatNumber(a * a + b * b)} mas não extraiu a raiz quadrada.`,
    },
    {
      value: Math.sqrt(a + b),
      misconceptionId: "PYT-SQRT-FIRST",
      feedback: `Você tirou a raiz antes de somar. A ordem é elevar, somar e só então extrair a raiz.`,
    },
    {
      value: a + b + c,
      misconceptionId: "PYT-PERIMETER",
      feedback: "Você calculou o perímetro do triângulo, não a hipotenusa.",
    },
    {
      value: Math.abs(a - b),
      misconceptionId: "PYT-SUBTRACT-NO-SQUARE",
      feedback: "A hipotenusa não é a diferença entre os catetos.",
    },
    {
      value: 2 * c,
      misconceptionId: "PYT-PERIMETER",
      feedback: "Você dobrou a hipotenusa.",
    },
  ];
  return out;
}

function distractorsForLeg(draft: ProblemDraft): DistractorSpec[] {
  const a = Number(draft.variables.a);
  const b = Number(draft.variables.b);
  const c = Number(draft.variables.c);
  const known = Number(draft.variables.knownLeg);
  const unknown = Number(draft.variables.unknown);
  return [
    {
      value: hyp(known, c),
      misconceptionId: "PYT-ADD-INSTEAD-SUBTRACT",
      feedback: `Você somou os quadrados. Para achar um cateto: ${formatNumber(unknown)}² = ${formatNumber(c)}² − ${formatNumber(known)}².`,
    },
    {
      value: c * c - known * known,
      misconceptionId: "PYT-NO-SQRT",
      feedback: `Você chegou em ${formatNumber(unknown)}² = ${formatNumber(c * c - known * known)} e parou. Falta a raiz quadrada.`,
    },
    {
      value: Math.max(0, c - known),
      misconceptionId: "PYT-SUBTRACT-NO-SQUARE",
      feedback: "A subtração vale entre os quadrados, não entre os comprimentos.",
    },
    {
      value: c + known,
      misconceptionId: "PYT-PERIMETER",
      feedback: "Você somou dois lados do triângulo.",
    },
    {
      value: known,
      misconceptionId: "PYT-WRONG-HYPOTENUSE",
      feedback: "Você repetiu o cateto conhecido. O cateto que falta é diferente dele.",
    },
    {
      value: Math.sqrt(c + known),
      misconceptionId: "PYT-SQRT-FIRST",
      feedback: "A raiz vem depois da subtração dos quadrados.",
    },
  ];
}

function distractorsForContext(draft: ProblemDraft): DistractorSpec[] {
  const solveFor = String(draft.variables.solveFor);
  const a = Number(draft.variables.a);
  const b = Number(draft.variables.b);
  const c = Number(draft.variables.c);
  if (solveFor === "c") return distractorsForHypotenuse(draft);
  const known = solveFor === "a" ? b : a;
  const unknown = solveFor === "a" ? a : b;
  return [
    {
      value: hyp(known, c),
      misconceptionId: "PYT-ADD-INSTEAD-SUBTRACT",
      feedback: "Você somou os quadrados. Para achar o cateto, subtraia: x² = c² − a².",
    },
    {
      value: c * c - known * known,
      misconceptionId: "PYT-NO-SQRT",
      feedback: "Falta extrair a raiz quadrada do resultado.",
    },
    {
      value: known,
      misconceptionId: "PYT-WRONG-HYPOTENUSE",
      feedback: "Você respondeu com o valor que já era conhecido no problema.",
    },
    {
      value: Math.max(0, c - known),
      misconceptionId: "PYT-SUBTRACT-NO-SQUARE",
      feedback: "Subtraia os quadrados, não os comprimentos.",
    },
    {
      value: c + known,
      misconceptionId: "PYT-PERIMETER",
      feedback: "Isso é a soma de dois lados, não o lado que falta.",
    },
    {
      value: unknown + 1,
      misconceptionId: "PYT-NEAR-MISS",
      feedback: "Revise o cálculo: o valor está próximo, mas não é exato.",
    },
  ];
}

function distractorsForTriple(draft: ProblemDraft): DistractorSpec[] {
  const c = Number(draft.variables.c);
  const a = Number(draft.variables.a);
  const b = Number(draft.variables.b);
  return [
    {
      value: c + 1,
      misconceptionId: "PYT-NEAR-MISS",
      feedback: `O terno (${formatNumber(a)}, ${formatNumber(b)}, ${formatNumber(c)}) é exato: c² é exatamente ${formatNumber(a * a + b * b)}.`,
    },
    {
      value: c - 1,
      misconceptionId: "PYT-NEAR-MISS",
      feedback: `Quase: ${formatNumber(c - 1)}² daria ${formatNumber((c - 1) * (c - 1))}, e não ${formatNumber(a * a + b * b)}.`,
    },
    {
      value: a + b,
      misconceptionId: "PYT-SUM-LEGS",
      feedback: "Neste terno a hipotenusa não é a soma dos catetos.",
    },
    {
      value: a * a + b * b,
      misconceptionId: "PYT-NO-SQRT",
      feedback: `Isso é c² = ${formatNumber(a * a + b * b)}. Falta a raiz.`,
    },
    {
      value: hyp(a, b) + 0.5,
      misconceptionId: "PYT-NEAR-MISS",
      feedback: "Verifique o terno pitagórico: o valor não é esse.",
    },
  ];
}

/* ------------------------------------------------------------- validators */

const validateGeometry: DraftValidator = (draft) => {
  const issues: ValidationIssue[] = [];
  const a = Number(draft.variables.a ?? draft.variables.legA ?? 0);
  const b = Number(draft.variables.b ?? draft.variables.legB ?? 0);
  const c = Number(draft.variables.c ?? 0);
  if (!Number.isFinite(draft.answerValue)) {
    issues.push(issue("PYT-ANSWER-NAN", "answer is not finite", "error", { variables: draft.variables }));
  }
  if (draft.variables.kind !== "multi" || draft.variables.solveFor !== "area") {
    if (a > 0 && b > 0 && c > 0 && !triangleInequality(a, b, c)) {
      issues.push(issue("PYT-TRIANGLE-INEQUALITY", "triangle inequality violated", "error", { a, b, c }));
    }
    if (a > 0 && b > 0 && c > 0 && !isRightTriangle(a, b, c, 1e-6)) {
      issues.push(issue("PYT-NOT-RIGHT", "sides do not form a right triangle", "error", { a, b, c }));
    }
  }
  if (draft.answerValue <= 0) {
    issues.push(issue("PYT-ANSWER-NONPOSITIVE", "answer must be positive", "error", { answer: draft.answerValue }));
  }
  if (draft.answerValue > 100000) {
    issues.push(issue("PYT-ANSWER-UNREASONABLE", "answer is unrealistically large", "error", { answer: draft.answerValue }));
  }
  return issues;
};

const validatePrecision: DraftValidator = (draft) => {
  const issues: ValidationIssue[] = [];
  const display = draft.answerDisplay ?? "";
  if (!display) return issues;
  if (display.length > 14) {
    issues.push(issue("PYT-DISPLAY-LONG", "answer display is too long", "error", { display }));
  }
  const numeric = Number(display.replace(",", "."));
  if (Number.isFinite(numeric) && !display.includes("√")) {
    const scale = Math.max(1, Math.abs(draft.answerValue), Math.abs(numeric));
    if (Math.abs(numeric - draft.answerValue) > 0.01 * scale + 0.005) {
      issues.push(
        issue("PYT-DISPLAY-MISMATCH", "answer display does not match the computed value", "error", {
          display,
          answerValue: draft.answerValue,
        }),
      );
    }
  }
  return issues;
};

const validatePrompt: DraftValidator = (draft) => {
  const issues: ValidationIssue[] = [];
  if (draft.prompt.trim().length < 20) {
    issues.push(issue("PYT-PROMPT-SHORT", "prompt is too short", "error"));
  }
  if (/undefined|NaN|Infinity/.test(draft.prompt)) {
    issues.push(issue("PYT-PROMPT-BROKEN", "prompt contains invalid tokens", "error", { prompt: draft.prompt }));
  }
  return issues;
};

/* ------------------------------------------------------------- pack */

export const pythagorasPack: ProblemPack = {
  conceptId: "geo-pythagoras",
  seedPrefix: "GEO-PYT",
  families: [
    {
      id: "find-hypotenuse",
      title: "Determinar a hipotenusa",
      description: "Catetos conhecidos, hipotenusa desconhecida.",
      difficulties: ["leve", "normal", "avancada"],
      weight: 1.4,
    },
    {
      id: "find-leg",
      title: "Determinar um cateto",
      description: "Hipotenusa e um cateto conhecidos.",
      difficulties: ["normal", "avancada"],
      weight: 1.3,
    },
    {
      id: "triples",
      title: "Ternos pitagóricos",
      description: "Reconhecer trios como 3-4-5 e 5-12-13.",
      difficulties: ["leve", "normal"],
      weight: 1.1,
    },
    {
      id: "decimals",
      title: "Valores decimais",
      description: "Medidas não inteiras, resultado exato.",
      difficulties: ["normal", "avancada"],
      weight: 1,
    },
    {
      id: "diagram",
      title: "Leitura de diagrama",
      description: "Interpretar a figura e identificar a incógnita.",
      difficulties: ["leve", "normal"],
      weight: 1.1,
    },
    {
      id: "context",
      title: "Problema contextualizado",
      description: "Escada, tela, rampa, deslocamento.",
      difficulties: ["leve", "normal", "avancada"],
      weight: 1.2,
    },
    {
      id: "right-or-not",
      title: "É retângulo?",
      description: "Verificar a condição de Pitágoras.",
      difficulties: ["normal", "avancada"],
      weight: 0.9,
    },
    {
      id: "multi-step",
      title: "Problema em duas etapas",
      description: "Perímetro, área e conversão de unidades.",
      difficulties: ["avancada"],
      weight: 1.3,
    },
  ],
  templates: [
    {
      id: "pyt-hyp",
      familyId: "find-hypotenuse",
      difficulties: ["leve", "normal", "avancada"],
      build: buildFindHypotenuse,
    },
    {
      id: "pyt-leg",
      familyId: "find-leg",
      difficulties: ["normal", "avancada"],
      build: buildMissingLeg,
    },
    {
      id: "pyt-triple",
      familyId: "triples",
      difficulties: ["leve", "normal"],
      build: buildTripleRecognition,
    },
    {
      id: "pyt-triple-radical",
      familyId: "triples",
      difficulties: ["normal"],
      build: buildTripleRadical,
    },
    {
      id: "pyt-decimals",
      familyId: "decimals",
      difficulties: ["normal", "avancada"],
      build: buildDecimals,
    },
    {
      id: "pyt-diagram",
      familyId: "diagram",
      difficulties: ["leve", "normal"],
      build: buildFindHypotenuse,
    },
    {
      id: "pyt-context",
      familyId: "context",
      difficulties: ["leve", "normal", "avancada"],
      build: buildContext,
    },
    {
      id: "pyt-right-or-not",
      familyId: "right-or-not",
      difficulties: ["normal", "avancada"],
      build: buildRightOrNot,
    },
    {
      id: "pyt-multi",
      familyId: "multi-step",
      difficulties: ["avancada"],
      build: buildMultiStep,
    },
  ],
  validators: [validateGeometry, validatePrecision, validatePrompt],
  distractorGenerators: [
    (draft) => {
      switch (draft.variables.kind) {
        case "hypotenuse":
        case "decimals":
          return draft.variables.solveFor === "c"
            ? distractorsForHypotenuse(draft)
            : distractorsForContext(draft);
        case "leg":
        case "decimals-leg":
          return distractorsForLeg(draft);
        case "triple":
          return distractorsForTriple(draft);
        case "context":
          return distractorsForContext(draft);
        default:
          return [];
      }
    },
  ],
  difficultyRules: {
    leve: { alternatives: 5, decimals: 2, allowRadical: true },
    normal: { alternatives: 5, decimals: 2, allowRadical: true },
    avancada: { alternatives: 5, decimals: 2, allowRadical: false },
  },
  misconceptions: pythagorasMisconceptions,
  defaultUnit: "cm",
};

