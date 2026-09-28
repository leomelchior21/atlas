import { formatNumber, isInteger, round } from "@/lib/format";
import { polygonArea } from "@/lib/geometry";
import type { DistractorSpec, GenerateContext, ProblemDraft, ProblemPack } from "../types";
import { geometricValidator, precisionValidatorFactory, promptValidator } from "./shared";

const misconceptions = [
  {
    id: "AREA-NO-HALF",
    title: "Esqueceu de dividir por 2",
    explanation:
      "O triângulo é metade de um retângulo de mesma base e altura. Por isso a área é (b × h) ÷ 2.",
    conceptHint: "entender",
  },
  {
    id: "AREA-HALF-TWICE",
    title: "Dividiu duas vezes",
    explanation: "A divisão por 2 aparece uma única vez na fórmula da área do triângulo.",
    conceptHint: "entender",
  },
  {
    id: "AREA-PERIMETER",
    title: "Calculou o perímetro",
    explanation:
      "Perímetro é a soma dos lados (contorno). Área é a quantidade de superfície. São medidas diferentes.",
    conceptHint: "comparar",
  },
  {
    id: "AREA-ADD",
    title: "Somou as dimensões",
    explanation: "Área é multiplicação: base × altura. Somar as dimensões mede o contorno.",
    conceptHint: "explorar",
  },
  {
    id: "AREA-WRONG-DIMENSION",
    title: "Usou a dimensão errada",
    explanation:
      "A altura de um paralelogramo é perpendicular à base. O lado inclinado não é a altura.",
    conceptHint: "explorar",
  },
  {
    id: "AREA-TRAPEZOID",
    title: "Trapézio sem o fator correto",
    explanation: "No trapézio, a área é (base maior + base menor) × altura ÷ 2.",
    conceptHint: "entender",
  },
  {
    id: "AREA-UNIT",
    title: "Erro na conversão de unidades",
    explanation:
      "1 m = 100 cm, portanto 1 m² = 10.000 cm². Converta as medidas lineares antes de multiplicar.",
    conceptHint: "explorar",
  },
  {
    id: "AREA-INVERT",
    title: "Respondeu outra grandeza",
    explanation: "Verifique se o problema pede área, perímetro ou uma medida linear.",
    conceptHint: "comparar",
  },
];

function rectDims(ctx: GenerateContext, min: number, max: number): [number, number] {
  const a = ctx.rng.int(min, max);
  let b = ctx.rng.int(min, max);
  if (b === a) b = a + ctx.rng.int(1, 4);
  return [a, b];
}

function buildRectangle(ctx: GenerateContext): ProblemDraft | null {
  const [b, h] = rectDims(ctx, 3, ctx.difficulty === "leve" ? 12 : 24);
  const area = b * h;
  const perimeter = 2 * (b + h);
  return {
    prompt: `Um retângulo tem ${formatNumber(b)} cm de base e ${formatNumber(h)} cm de altura. Qual é a área desse retângulo?`,
    templateId: ctx.templateId,
    variables: { b, h, area, kind: "rectangle", solveFor: "area" },
    diagram: {
      kind: "rectangle",
      width: b,
      height: h,
      labelWidth: `${formatNumber(b)} cm`,
      labelHeight: `${formatNumber(h)} cm`,
    },
    formula: "A = b × h",
    answerValue: area,
    answerDisplay: formatNumber(area),
    unit: "cm²",
    distractors: [
      {
        value: b + h,
        misconceptionId: "AREA-ADD",
        feedback: `Você somou as dimensões: ${formatNumber(b)} + ${formatNumber(h)}. Área é base × altura.`,
      },
      {
        value: perimeter,
        misconceptionId: "AREA-PERIMETER",
        feedback: "Perímetro é a soma dos quatro lados (2b + 2h). A área é b × h.",
      },
      {
        value: (b + h) * 2 - 2 * h,
        misconceptionId: "AREA-INVERT",
        feedback: "Você calculou uma medida de comprimento. Área se mede em cm².",
      },
      {
        value: area / 2,
        misconceptionId: "AREA-NO-HALF",
        feedback: "O retângulo não é dividido por 2 — quem tem a metade é o triângulo.",
      },
    ],
    solutionSteps: [
      { expression: `A = b × h` },
      { expression: `A = ${formatNumber(b)} × ${formatNumber(h)} = ${formatNumber(area)} cm²` },
    ],
    fingerprint: { familyId: "rectangle", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: b + h },
  };
}

function buildTriangle(ctx: GenerateContext): ProblemDraft | null {
  const [b, h] = rectDims(ctx, 4, ctx.difficulty === "leve" ? 14 : 30);
  const doubled = ctx.rng.bool(0.4);
  const base = doubled ? 2 * b : b;
  const area = (base * h) / 2;
  const exact = isInteger(area);
  if (!exact) return null;
  const perimeterish = base + h;
  return {
    prompt: `Um triângulo tem base de ${formatNumber(base)} cm e altura de ${formatNumber(h)} cm. Qual é a área desse triângulo?`,
    templateId: ctx.templateId,
    variables: { base, h, area, kind: "triangle", solveFor: "area" },
    diagram: {
      kind: "triangle-sides",
      sides: [base, base, base],
      labels: [`${formatNumber(base)} cm`, `${formatNumber(h)} cm (altura)`, ""],
    },
    formula: "A = (b × h) ÷ 2",
    answerValue: area,
    answerDisplay: formatNumber(area),
    unit: "cm²",
    distractors: [
      {
        value: base * h,
        misconceptionId: "AREA-NO-HALF",
        feedback: `Você calculou ${formatNumber(base)} × ${formatNumber(h)} = ${formatNumber(base * h)} e esqueceu de dividir por 2.`,
      },
      {
        value: (base * h) / 4,
        misconceptionId: "AREA-HALF-TWICE",
        feedback: "A divisão por 2 aparece uma única vez.",
      },
      {
        value: base + h,
        misconceptionId: "AREA-ADD",
        feedback: "Área é multiplicação (e depois divisão por 2), não soma.",
      },
      {
        value: 2 * (base + h),
        misconceptionId: "AREA-PERIMETER",
        feedback: "Esse é um perímetro. A área do triângulo é (base × altura) ÷ 2.",
      },
      {
        value: perimeterish,
        misconceptionId: "AREA-INVERT",
        feedback: "Você somou base e altura; a área é o produto dividido por 2.",
      },
    ],
    solutionSteps: [
      { expression: `A = (b × h) ÷ 2` },
      { expression: `A = (${formatNumber(base)} × ${formatNumber(h)}) ÷ 2 = ${formatNumber(area)} cm²` },
    ],
    fingerprint: { familyId: "triangle", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: base + h },
  };
}

function buildParallelogram(ctx: GenerateContext): ProblemDraft | null {
  const [b, h] = rectDims(ctx, 5, 18);
  const slant = h + ctx.rng.int(1, 4);
  const area = b * h;
  return {
    prompt: `Um paralelogramo tem base de ${formatNumber(b)} cm e altura de ${formatNumber(h)} cm. Qual é a sua área?`,
    templateId: ctx.templateId,
    variables: { b, h, slant, area, kind: "parallelogram", solveFor: "area" },
    diagram: {
      kind: "polygon",
      sides: [b, slant, b, slant],
      labels: [`${formatNumber(b)} cm`, `${formatNumber(slant)} cm`, `${formatNumber(b)} cm`, `${formatNumber(slant)} cm`],
      caption: `altura = ${formatNumber(h)} cm`,
    },
    answerValue: area,
    answerDisplay: formatNumber(area),
    unit: "cm²",
    distractors: [
      {
        value: b * slant,
        misconceptionId: "AREA-WRONG-DIMENSION",
        feedback: `Você usou o lado inclinado (${formatNumber(slant)} cm). A área usa a altura perpendicular: ${formatNumber(h)} cm.`,
      },
      {
        value: 2 * (b + slant),
        misconceptionId: "AREA-PERIMETER",
        feedback: "Isso é o perímetro do paralelogramo.",
      },
      {
        value: (b * h) / 2,
        misconceptionId: "AREA-NO-HALF",
        feedback: "A divisão por 2 é do triângulo. O paralelogramo usa base × altura.",
      },
      {
        value: b + h,
        misconceptionId: "AREA-ADD",
        feedback: "Área é multiplicação.",
      },
    ],
    solutionSteps: [
      { expression: `A = b × h` },
      { expression: `A = ${formatNumber(b)} × ${formatNumber(h)} = ${formatNumber(area)} cm²` },
    ],
    fingerprint: { familyId: "parallelogram", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: b + h },
  };
}

function buildTrapezoid(ctx: GenerateContext): ProblemDraft | null {
  const small = ctx.rng.int(4, 12);
  const big = small + ctx.rng.int(3, 14);
  const h = ctx.rng.pick([4, 6, 8, 10, 12, 14, 16]);
  const sum = big + small;
  const area = (sum * h) / 2;
  if (!isInteger(area)) return null;
  return {
    prompt: `Um trapézio tem bases de ${formatNumber(big)} cm e ${formatNumber(small)} cm e altura de ${formatNumber(h)} cm. Qual é a sua área?`,
    templateId: ctx.templateId,
    variables: { big, small, h, area, kind: "trapezoid", solveFor: "area" },
    diagram: {
      kind: "polygon",
      sides: [big, h, small, h],
      labels: [`B = ${formatNumber(big)}`, `h = ${formatNumber(h)}`, `b = ${formatNumber(small)}`, `h = ${formatNumber(h)}`],
    },
    answerValue: area,
    answerDisplay: formatNumber(area),
    unit: "cm²",
    distractors: [
      {
        value: sum * h,
        misconceptionId: "AREA-TRAPEZOID",
        feedback: "Falta dividir por 2: A = (B + b) × h ÷ 2.",
      },
      {
        value: big * h,
        misconceptionId: "AREA-WRONG-DIMENSION",
        feedback: "Você usou apenas a base maior. O trapézio tem duas bases.",
      },
      {
        value: (big - small) * h,
        misconceptionId: "AREA-WRONG-DIMENSION",
        feedback: "As bases se somam, não se subtraem.",
      },
      {
        value: 2 * (big + small) + 2 * h,
        misconceptionId: "AREA-PERIMETER",
        feedback: "Isso é um perímetro aproximado. A área é (B + b) × h ÷ 2.",
      },
    ],
    solutionSteps: [
      { expression: `A = (B + b) × h ÷ 2` },
      { expression: `A = (${formatNumber(big)} + ${formatNumber(small)}) × ${formatNumber(h)} ÷ 2` },
      { expression: `A = ${formatNumber(area)} cm²` },
    ],
    fingerprint: { familyId: "trapezoid", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: big + h },
  };
}

function buildMissingDimension(ctx: GenerateContext): ProblemDraft | null {
  const h = ctx.rng.int(3, 18);
  const b = ctx.rng.int(3, 18);
  const area = b * h;
  return {
    prompt: `Um retângulo tem área de ${formatNumber(area)} cm² e base de ${formatNumber(b)} cm. Qual é a altura desse retângulo?`,
    templateId: ctx.templateId,
    variables: { b, h, area, kind: "missing-dimension", solveFor: "h" },
    diagram: {
      kind: "rectangle",
      width: b,
      height: h / 2,
      labelWidth: `${formatNumber(b)} cm`,
      labelHeight: "h = ?",
    },
    answerValue: h,
    answerDisplay: `${formatNumber(h)} cm`,
    unit: "cm",
    distractors: [
      {
        value: area - b,
        misconceptionId: "AREA-ADD",
        feedback: "A área não se relaciona com a base por subtração. Use A = b × h.",
      },
      {
        value: area / 2 - b > 0 ? round(area / 2 - b, 2) : round(area * b, 2),
        misconceptionId: "AREA-INVERT",
        feedback: "Resolva A = b × h isolando h: h = A ÷ b.",
      },
      {
        value: 2 * (b + h),
        misconceptionId: "AREA-PERIMETER",
        feedback: "Isso é o perímetro. Para a altura, divida a área pela base.",
      },
      {
        value: h + 2,
        misconceptionId: "AREA-INVERT",
        feedback: `Revise a divisão: ${formatNumber(area)} ÷ ${formatNumber(b)}.`,
      },
    ],
    solutionSteps: [
      { expression: `A = b × h → h = A ÷ b` },
      { expression: `h = ${formatNumber(area)} ÷ ${formatNumber(b)} = ${formatNumber(h)} cm` },
    ],
    fingerprint: { familyId: "missing-dimension", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: area },
  };
}

function buildComposite(ctx: GenerateContext): ProblemDraft | null {
  const mode = ctx.rng.pick(["l-shape", "unit-conversion", "triangle-inside"]);
  if (mode === "unit-conversion") {
    const b = ctx.rng.int(2, 9) / 2;
    const h = ctx.rng.pick([1, 1.5, 2, 2.5, 3]);
    const bMeters = b;
    const hCm = h * 100;
    const area = bMeters * h;
    return {
      prompt: `Um terreno retangular tem ${formatNumber(bMeters)} m de frente e ${formatNumber(hCm)} cm de profundidade. Qual é a área do terreno, em metros quadrados?`,
      templateId: `${ctx.templateId}:unit`,
      context: "area-unit-conversion",
      variables: { b: bMeters, h, hCm, area, kind: "composite" },
      diagram: {
        kind: "rectangle",
        width: bMeters,
        height: h,
        labelWidth: `${formatNumber(bMeters)} m`,
        labelHeight: `${formatNumber(hCm)} cm`,
      },
      answerValue: area,
      answerDisplay: formatNumber(area),
      unit: "m²",
      distractors: [
        {
          value: bMeters * hCm,
          misconceptionId: "AREA-UNIT",
          feedback: `Você multiplicou ${formatNumber(bMeters)} por ${formatNumber(hCm)} sem converter. ${formatNumber(hCm)} cm = ${formatNumber(h)} m.`,
        },
        {
          value: round(area / 100, 4),
          misconceptionId: "AREA-UNIT",
          feedback: "A conversão de área usa fator 10.000 (1 m² = 10.000 cm²), não 100.",
        },
        {
          value: round((bMeters + hCm) / 100, 4),
          misconceptionId: "AREA-ADD",
          feedback: "Área é multiplicação depois da conversão.",
        },
        {
          value: round(2 * (bMeters + h), 4),
          misconceptionId: "AREA-PERIMETER",
          feedback: "Isso é o perímetro do terreno.",
        },
      ],
      solutionSteps: [
        { expression: `${formatNumber(hCm)} cm = ${formatNumber(h)} m` },
        { expression: `A = ${formatNumber(bMeters)} × ${formatNumber(h)} = ${formatNumber(area)} m²` },
      ],
      fingerprint: { familyId: "composite", templateId: `${ctx.templateId}:unit`, conceptId: ctx.conceptId, context: "area-unit", magnitude: bMeters + h },
    };
  }

  if (mode === "triangle-inside") {
    const b = ctx.rng.int(6, 20);
    const h = ctx.rng.int(4, 16);
    const rectArea = b * h;
    const triArea = (b * h) / 2;
    if (!isInteger(triArea)) return null;
    return {
      prompt: `Um retângulo tem ${formatNumber(b)} cm por ${formatNumber(h)} cm. Uma diagonal divide o retângulo em dois triângulos iguais. Qual é a área de cada triângulo?`,
      templateId: `${ctx.templateId}:triangle-inside`,
      context: "triangle-inside-rectangle",
      variables: { b, h, rectArea, area: triArea, kind: "composite" },
      diagram: {
        kind: "rectangle",
        width: b,
        height: h,
        labelWidth: `${formatNumber(b)} cm`,
        labelHeight: `${formatNumber(h)} cm`,
        labelDiagonal: "diagonal",
        diagonal: true,
      },
      answerValue: triArea,
      answerDisplay: formatNumber(triArea),
      unit: "cm²",
      distractors: [
        {
          value: rectArea,
          misconceptionId: "AREA-NO-HALF",
          feedback: "A diagonal divide o retângulo em dois triângulos iguais: cada um tem metade da área.",
        },
        {
          value: (b + h) / 2,
          misconceptionId: "AREA-INVERT",
          feedback: "Use a área do retângulo e divida por 2.",
        },
        {
          value: 2 * rectArea,
          misconceptionId: "AREA-HALF-TWICE",
          feedback: "A área do triângulo é menor que a do retângulo, não maior.",
        },
        {
          value: b + h,
          misconceptionId: "AREA-ADD",
          feedback: "Área é multiplicação, não soma.",
        },
      ],
      solutionSteps: [
        { expression: `A(retângulo) = ${formatNumber(b)} × ${formatNumber(h)} = ${formatNumber(rectArea)} cm²` },
        { expression: `A(triângulo) = ${formatNumber(rectArea)} ÷ 2 = ${formatNumber(triArea)} cm²` },
      ],
      fingerprint: { familyId: "composite", templateId: `${ctx.templateId}:triangle-inside`, conceptId: ctx.conceptId, context: "triangle-inside", magnitude: rectArea },
    };
  }

  const w = ctx.rng.int(6, 16);
  const h = ctx.rng.int(6, 16);
  const cutW = ctx.rng.int(2, w - 2);
  const cutH = ctx.rng.int(2, h - 2);
  const full = w * h;
  const cut = cutW * cutH;
  const area = full - cut;
  const label = `figura em L: retângulo de ${formatNumber(w)} cm × ${formatNumber(h)} cm com um recorte de ${formatNumber(cutW)} cm × ${formatNumber(cutH)} cm`;
  return {
    prompt: `Uma figura tem a forma de um L: é um retângulo de ${formatNumber(w)} cm por ${formatNumber(h)} cm com um recorte retangular de ${formatNumber(cutW)} cm por ${formatNumber(cutH)} cm. Qual é a área da figura?`,
    templateId: `${ctx.templateId}:l-shape`,
    context: "l-shape",
    variables: { w, h, cutW, cutH, full, cut, area, kind: "composite" },
    diagram: {
      kind: "l-shape",
      width: w,
      height: h,
      cutWidth: cutW,
      cutHeight: cutH,
      caption: label,
    },
    answerValue: area,
    answerDisplay: formatNumber(area),
    unit: "cm²",
    distractors: [
      {
        value: full,
        misconceptionId: "AREA-NO-HALF",
        feedback: "Você calculou a área do retângulo completo e ignorou o recorte.",
      },
      {
        value: full + cut,
        misconceptionId: "AREA-ADD",
        feedback: "O recorte é retirado (subtração), não somado.",
      },
      {
        value: 2 * (w + h),
        misconceptionId: "AREA-PERIMETER",
        feedback: "Isso é o perímetro do retângulo completo.",
      },
      {
        value: cut,
        misconceptionId: "AREA-INVERT",
        feedback: "Você respondeu a área do recorte, e não da figura final.",
      },
    ],
    solutionSteps: [
      { expression: `A(total) = ${formatNumber(w)} × ${formatNumber(h)} = ${formatNumber(full)} cm²` },
      { expression: `A(recorte) = ${formatNumber(cutW)} × ${formatNumber(cutH)} = ${formatNumber(cut)} cm²` },
      { expression: `A(figura) = ${formatNumber(full)} − ${formatNumber(cut)} = ${formatNumber(area)} cm²` },
    ],
    fingerprint: { familyId: "composite", templateId: `${ctx.templateId}:l-shape`, conceptId: ctx.conceptId, context: "l-shape", magnitude: full },
  };
}


export const areaPack: ProblemPack = {
  conceptId: "geo-area",
  seedPrefix: "GEO-AREA",
  families: [
    { id: "rectangle", title: "Área do retângulo", description: "base × altura", difficulties: ["leve", "normal"], weight: 1.3 },
    { id: "triangle", title: "Área do triângulo", description: "(base × altura) ÷ 2", difficulties: ["leve", "normal"], weight: 1.4 },
    { id: "parallelogram", title: "Área do paralelogramo", description: "altura perpendicular", difficulties: ["normal"] },
    { id: "trapezoid", title: "Área do trapézio", description: "(B + b) × h ÷ 2", difficulties: ["normal"] },
    { id: "missing-dimension", title: "Dimensão que falta", description: "isolar a altura", difficulties: ["normal"], weight: 0.9 },
    { id: "composite", title: "Figuras compostas", description: "recortes e conversões", difficulties: ["avancada"], weight: 1.4 },
  ],
  templates: [
    { id: "area-rect", familyId: "rectangle", difficulties: ["leve", "normal"], build: buildRectangle },
    { id: "area-tri", familyId: "triangle", difficulties: ["leve", "normal"], build: buildTriangle },
    { id: "area-para", familyId: "parallelogram", difficulties: ["normal"], build: buildParallelogram },
    { id: "area-trap", familyId: "trapezoid", difficulties: ["normal"], build: buildTrapezoid },
    { id: "area-missing", familyId: "missing-dimension", difficulties: ["normal"], build: buildMissingDimension },
    { id: "area-composite", familyId: "composite", difficulties: ["avancada"], build: buildComposite },
  ],
  validators: [geometricValidator("AREA"), promptValidator, precisionValidatorFactory("AREA")],
  distractorGenerators: [],
  difficultyRules: {
    leve: { alternatives: 5, decimals: 2, allowRadical: false },
    normal: { alternatives: 5, decimals: 2, allowRadical: false },
    avancada: { alternatives: 5, decimals: 2, allowRadical: false },
  },
  misconceptions,
  defaultUnit: "cm²",
};
