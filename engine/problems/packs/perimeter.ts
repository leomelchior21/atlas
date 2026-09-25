import { formatNumber, isInteger, round } from "@/lib/format";
import type { DistractorSpec, GenerateContext, ProblemDraft, ProblemPack } from "../types";
import { geometricValidator, precisionValidatorFactory, promptValidator } from "./shared";

const misconceptions = [
  {
    id: "PER-AREA",
    title: "Calculou a área",
    explanation:
      "Perímetro é o comprimento do contorno. Multiplicar duas dimensões produz área, em unidades quadradas.",
    conceptHint: "comparar",
  },
  {
    id: "PER-HALF",
    title: "Usou metade do perímetro",
    explanation: "O semiperímetro é b + h. O perímetro completo é 2 × (b + h).",
    conceptHint: "entender",
  },
  {
    id: "PER-DOUBLE-ONE",
    title: "Dobrou apenas um lado",
    explanation: "No retângulo, base e altura aparecem duas vezes cada: P = 2b + 2h.",
    conceptHint: "entender",
  },
  {
    id: "PER-MISSED-SIDE",
    title: "Esqueceu um lado",
    explanation: "O perímetro soma todos os lados. Em um polígono, nenhum lado pode ficar de fora.",
    conceptHint: "explorar",
  },
  {
    id: "PER-EXTRA",
    title: "Somou um lado a mais",
    explanation: "Conte os lados do polígono antes de somar.",
    conceptHint: "explorar",
  },
  {
    id: "PER-UNIT",
    title: "Erro de conversão",
    explanation: "Converta todas as medidas para a mesma unidade antes de somar.",
    conceptHint: "explorar",
  },
  {
    id: "PER-NEAR",
    title: "Erro de aritmética",
    explanation: "A soma está próxima, mas não exata. Revise a conta.",
    conceptHint: "exemplos",
  },
];

function buildRectangle(ctx: GenerateContext): ProblemDraft | null {
  const b = ctx.rng.int(4, ctx.difficulty === "leve" ? 14 : 28);
  let h = ctx.rng.int(3, ctx.difficulty === "leve" ? 14 : 28);
  if (h === b) h += 1;
  const perimeter = 2 * (b + h);
  return {
    prompt: `Um retângulo tem ${formatNumber(b)} cm de base e ${formatNumber(h)} cm de altura. Qual é o perímetro desse retângulo?`,
    templateId: ctx.templateId,
    variables: { b, h, perimeter, kind: "rectangle" },
    diagram: {
      kind: "rectangle",
      width: b,
      height: h,
      labelWidth: `${formatNumber(b)} cm`,
      labelHeight: `${formatNumber(h)} cm`,
    },
    formula: ctx.difficulty === "leve" ? "P = 2 × (b + h)" : undefined,
    answerValue: perimeter,
    answerDisplay: `${formatNumber(perimeter)} cm`,
    unit: "cm",
    distractors: [
      {
        value: b * h,
        misconceptionId: "PER-AREA",
        feedback: `${formatNumber(b)} × ${formatNumber(h)} = ${formatNumber(b * h)} é a área, em cm². O perímetro soma os lados.`,
      },
      {
        value: b + h,
        misconceptionId: "PER-HALF",
        feedback: "Você somou um lado de cada. Falta dobrar: 2 × (b + h).",
      },
      {
        value: 2 * b + h,
        misconceptionId: "PER-DOUBLE-ONE",
        feedback: "Base e altura aparecem duas vezes cada.",
      },
      {
        value: b + h + 2,
        misconceptionId: "PER-NEAR",
        feedback: "Revise a soma: são quatro lados.",
      },
    ],
    solutionSteps: [
      { expression: `P = ${formatNumber(b)} + ${formatNumber(h)} + ${formatNumber(b)} + ${formatNumber(h)}` },
      { expression: `P = 2 × (${formatNumber(b)} + ${formatNumber(h)}) = ${formatNumber(perimeter)} cm` },
    ],
    fingerprint: { familyId: "rectangle", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: b + h },
  };
}

function buildSquare(ctx: GenerateContext): ProblemDraft | null {
  const side = ctx.rng.int(3, ctx.difficulty === "leve" ? 15 : 40);
  const perimeter = 4 * side;
  return {
    prompt: `Um quadrado tem lado de ${formatNumber(side)} cm. Qual é o perímetro desse quadrado?`,
    templateId: ctx.templateId,
    variables: { side, perimeter, kind: "square" },
    diagram: {
      kind: "polygon",
      sides: [side, side, side, side],
      labels: [`${formatNumber(side)} cm`, "", "", ""],
    },
    answerValue: perimeter,
    answerDisplay: `${formatNumber(perimeter)} cm`,
    unit: "cm",
    distractors: [
      {
        value: side * side,
        misconceptionId: "PER-AREA",
        feedback: "Você calculou a área. O perímetro é a soma dos quatro lados.",
      },
      {
        value: 2 * side,
        misconceptionId: "PER-HALF",
        feedback: "O quadrado tem quatro lados, não dois.",
      },
      {
        value: 3 * side,
        misconceptionId: "PER-MISSED-SIDE",
        feedback: "Você somou apenas três lados.",
      },
      {
        value: 5 * side,
        misconceptionId: "PER-EXTRA",
        feedback: "O quadrado tem quatro lados — você contou um a mais.",
      },
    ],
    solutionSteps: [
      { expression: `P = 4 × lado` },
      { expression: `P = 4 × ${formatNumber(side)} = ${formatNumber(perimeter)} cm` },
    ],
    fingerprint: { familyId: "square", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: side },
  };
}

function buildPolygon(ctx: GenerateContext): ProblemDraft | null {
  const count = ctx.rng.pick([5, 6, 6, 7, 8]);
  const sides = Array.from({ length: count }, () => ctx.rng.int(2, 15));
  const perimeter = sides.reduce((sum, s) => sum + s, 0);
  const names: Record<number, string> = { 5: "pentágono", 6: "hexágono", 7: "heptágono", 8: "octógono" };
  return {
    prompt: `Um ${names[count]} tem lados medindo ${sides.map((s) => formatNumber(s)).join(" cm, ")} cm. Qual é o perímetro desse polígono?`,
    templateId: ctx.templateId,
    variables: { count, perimeter, kind: "polygon", ...Object.fromEntries(sides.map((s, i) => [`s${i}`, s])) },
    diagram: { kind: "polygon", sides, labels: sides.map((s) => `${formatNumber(s)}`) },
    answerValue: perimeter,
    answerDisplay: `${formatNumber(perimeter)} cm`,
    unit: "cm",
    distractors: [
      {
        value: perimeter - sides[0],
        misconceptionId: "PER-MISSED-SIDE",
        feedback: `Você deixou de somar um lado de ${formatNumber(sides[0])} cm.`,
      },
      {
        value: perimeter + sides[sides.length - 1],
        misconceptionId: "PER-EXTRA",
        feedback: "Um dos lados foi contado duas vezes.",
      },
      {
        value: sides[0] * sides[1],
        misconceptionId: "PER-AREA",
        feedback: "Multiplicar dois lados produz uma área, não o perímetro.",
      },
      {
        value: perimeter + 1,
        misconceptionId: "PER-NEAR",
        feedback: "Revise a soma: ela precisa incluir todos os lados exatamente uma vez.",
      },
    ],
    solutionSteps: [
      { expression: `P = ${sides.map((s) => formatNumber(s)).join(" + ")}` },
      { expression: `P = ${formatNumber(perimeter)} cm` },
    ],
    fingerprint: { familyId: "polygon", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: perimeter },
  };
}

function buildMissingSide(ctx: GenerateContext): ProblemDraft | null {
  const others = [ctx.rng.int(3, 14), ctx.rng.int(3, 14), ctx.rng.int(3, 14)];
  const missing = ctx.rng.int(4, 16);
  const perimeter = others.reduce((s, v) => s + v, 0) + missing;
  return {
    prompt: `Um quadrilátero tem perímetro de ${formatNumber(perimeter)} cm. Três lados medem ${formatNumber(others[0])} cm, ${formatNumber(others[1])} cm e ${formatNumber(others[2])} cm. Qual é a medida do quarto lado?`,
    templateId: ctx.templateId,
    variables: { perimeter, missing, kind: "missing-side", ...Object.fromEntries(others.map((v, i) => [`s${i}`, v])) },
    diagram: {
      kind: "polygon",
      sides: [others[0], others[1], others[2], missing],
      labels: [formatNumber(others[0]), formatNumber(others[1]), formatNumber(others[2]), "?"],
    },
    answerValue: missing,
    answerDisplay: `${formatNumber(missing)} cm`,
    unit: "cm",
    distractors: [
      {
        value: perimeter,
        misconceptionId: "PER-AREA",
        feedback: "O perímetro total já era conhecido. Falta subtrair os lados dados.",
      },
      {
        value: others[0] + others[1] + others[2] - missing,
        misconceptionId: "PER-NEAR",
        feedback: "Subtraia a soma dos três lados do perímetro total.",
      },
      {
        value: Math.abs(perimeter - others[0] * 2),
        misconceptionId: "PER-EXTRA",
        feedback: "Some os três lados primeiro e subtraia essa soma do perímetro.",
      },
      {
        value: missing + 3,
        misconceptionId: "PER-NEAR",
        feedback: `Revise: ${formatNumber(perimeter)} − (${others.map((v) => formatNumber(v)).join(" + ")}).`,
      },
    ],
    solutionSteps: [
      { expression: `soma dos três lados = ${formatNumber(others[0] + others[1] + others[2])} cm` },
      { expression: `lado que falta = ${formatNumber(perimeter)} − ${formatNumber(others[0] + others[1] + others[2])} = ${formatNumber(missing)} cm` },
    ],
    fingerprint: { familyId: "missing-side", templateId: ctx.templateId, conceptId: ctx.conceptId, magnitude: perimeter },
  };
}

function buildComposite(ctx: GenerateContext): ProblemDraft | null {
  const mode = ctx.rng.pick(["unit-conversion", "l-shape"]);
  if (mode === "unit-conversion") {
    const meters = ctx.rng.pick([1, 1.5, 2, 2.5, 3]);
    const cm = ctx.rng.pick([40, 60, 80, 120, 150]);
    const totalCm = meters * 100 + cm;
    const perimeter = 2 * (meters * 100 + cm) / 100;
    if (!isInteger(perimeter * 10)) return null;
    return {
      prompt: `Um retângulo tem ${formatNumber(meters)} m de base e ${formatNumber(cm)} cm de altura. Qual é o perímetro, em centímetros?`,
      templateId: `${ctx.templateId}:unit`,
      context: "perimeter-unit",
      variables: { b: meters, hCm: cm, bCm: meters * 100, perimeterCm: 2 * totalCm, kind: "composite" },
      diagram: {
        kind: "rectangle",
        width: meters,
        height: cm / 100,
        labelWidth: `${formatNumber(meters)} m`,
        labelHeight: `${formatNumber(cm)} cm`,
      },
      answerValue: 2 * totalCm,
      answerDisplay: `${formatNumber(2 * totalCm)} cm`,
      unit: "cm",
      distractors: [
        {
          value: 2 * (meters + cm),
          display: `${formatNumber(2 * (meters + cm))} cm`,
          misconceptionId: "PER-UNIT",
          feedback: `Você somou ${formatNumber(meters)} m com ${formatNumber(cm)} cm. ${formatNumber(meters)} m = ${formatNumber(meters * 100)} cm.`,
        },
        {
          value: totalCm,
          display: `${formatNumber(totalCm)} cm`,
          misconceptionId: "PER-HALF",
          feedback: "Você calculou o semiperímetro. Falta multiplicar por 2.",
        },
        {
          value: meters * 100 * cm,
          display: `${formatNumber(meters * 100 * cm)} cm²`,
          misconceptionId: "PER-AREA",
          feedback: "Isso é uma área, em cm².",
        },
        {
          value: 2 * totalCm + 100,
          display: `${formatNumber(2 * totalCm + 100)} cm`,
          misconceptionId: "PER-UNIT",
          feedback: "A conversão foi somada depois do cálculo. Converta antes.",
        },
      ],
      solutionSteps: [
        { expression: `${formatNumber(meters)} m = ${formatNumber(meters * 100)} cm` },
        { expression: `P = 2 × (${formatNumber(meters * 100)} + ${formatNumber(cm)}) = ${formatNumber(2 * totalCm)} cm` },
      ],
      fingerprint: { familyId: "composite", templateId: `${ctx.templateId}:unit`, conceptId: ctx.conceptId, context: "per-unit", magnitude: totalCm },
    };
  }

  const w = ctx.rng.int(6, 16);
  const h = ctx.rng.int(6, 16);
  const cutW = ctx.rng.int(2, w - 2);
  const cutH = ctx.rng.int(2, h - 2);
  const perimeter = 2 * (w + h);
  return {
    prompt: `Uma figura em L é um retângulo de ${formatNumber(w)} cm por ${formatNumber(h)} cm com um recorte retangular de ${formatNumber(cutW)} cm por ${formatNumber(cutH)} cm. Qual é o perímetro da figura?`,
    templateId: `${ctx.templateId}:l-shape`,
    context: "perimeter-l-shape",
    variables: { w, h, cutW, cutH, perimeter, kind: "composite" },
    diagram: {
      kind: "l-shape",
      width: w,
      height: h,
      cutWidth: cutW,
      cutHeight: cutH,
      caption: `recorte de ${formatNumber(cutW)} cm × ${formatNumber(cutH)} cm`,
    },
    answerValue: perimeter,
    answerDisplay: `${formatNumber(perimeter)} cm`,
    unit: "cm",
    distractors: [
      {
        value: perimeter + 2 * (cutW + cutH),
        misconceptionId: "PER-EXTRA",
        feedback: "O recorte não aumenta o contorno: o perímetro do L é igual ao do retângulo original.",
      },
      {
        value: perimeter - 2 * (cutW + cutH),
        misconceptionId: "PER-MISSED-SIDE",
        feedback: "Retirar um canto não reduz o contorno; ele é o mesmo do retângulo completo.",
      },
      {
        value: w * h - cutW * cutH,
        misconceptionId: "PER-AREA",
        feedback: "Isso é a área da figura, em cm².",
      },
      {
        value: round(perimeter / 2, 2),
        misconceptionId: "PER-HALF",
        feedback: "Você calculou o semiperímetro.",
      },
    ],
    solutionSteps: [
      { expression: "Ao recortar um canto, o contorno é o mesmo do retângulo completo" },
      { expression: `P = 2 × (${formatNumber(w)} + ${formatNumber(h)}) = ${formatNumber(perimeter)} cm` },
    ],
    fingerprint: { familyId: "composite", templateId: `${ctx.templateId}:l-shape`, conceptId: ctx.conceptId, context: "per-l-shape", magnitude: perimeter },
  };
}

export const perimeterPack: ProblemPack = {
  conceptId: "geo-perimeter",
  seedPrefix: "GEO-PER",
  families: [
    { id: "rectangle", title: "Perímetro do retângulo", description: "2 × (b + h)", difficulties: ["leve", "normal"], weight: 1.4 },
    { id: "square", title: "Perímetro do quadrado", description: "4 × lado", difficulties: ["leve"], weight: 1.1 },
    { id: "polygon", title: "Perímetro de polígonos", description: "soma de todos os lados", difficulties: ["normal"], weight: 1.2 },
    { id: "missing-side", title: "Lado desconhecido", description: "perímetro dado", difficulties: ["normal"], weight: 1 },
    { id: "composite", title: "Contorno composto", description: "figura em L e conversões", difficulties: ["avancada"], weight: 1.3 },
  ],
  templates: [
    { id: "per-rect", familyId: "rectangle", difficulties: ["leve", "normal"], build: buildRectangle },
    { id: "per-square", familyId: "square", difficulties: ["leve"], build: buildSquare },
    { id: "per-poly", familyId: "polygon", difficulties: ["normal"], build: buildPolygon },
    { id: "per-missing", familyId: "missing-side", difficulties: ["normal"], build: buildMissingSide },
    { id: "per-composite", familyId: "composite", difficulties: ["avancada"], build: buildComposite },
  ],
  validators: [geometricValidator("PER"), promptValidator, precisionValidatorFactory("PER")],
  distractorGenerators: [],
  difficultyRules: {
    leve: { alternatives: 5, decimals: 1, allowRadical: false },
    normal: { alternatives: 5, decimals: 1, allowRadical: false },
    avancada: { alternatives: 5, decimals: 2, allowRadical: false },
  },
  misconceptions,
  defaultUnit: "cm",
};
