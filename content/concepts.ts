import type { FunctionalConceptId } from "@/types/content";

export interface ConceptLegendItem {
  symbol: string;
  filled: boolean;
  label: string;
  detail: string;
  emphasis?: boolean;
}

export interface ConceptDefinition {
  id: FunctionalConceptId;
  nodeId: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  explanation: string;
  equation: string;
  legend: ConceptLegendItem[];
  journey: [string, string, string, string];
  years: number[];
  hintTitle: string;
  hint: string;
}

export const CONCEPTS: Record<FunctionalConceptId, ConceptDefinition> = {
  "geo-pythagoras": {
    id: "geo-pythagoras",
    nodeId: "geo-pythagoras",
    eyebrow: "TRIÂNGULOS",
    title: "TEOREMA DE PITÁGORAS",
    shortTitle: "Pitágoras",
    explanation:
      "Em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos.",
    equation: "a² + b² = c²",
    legend: [
      {
        symbol: "○",
        filled: false,
        label: "a, b",
        detail: "catetos (lados que formam o ângulo reto)",
      },
      {
        symbol: "●",
        filled: true,
        label: "c",
        detail: "hipotenusa (lado oposto ao ângulo reto)",
        emphasis: true,
      },
    ],
    journey: ["EXPLORAR", "ENTENDER", "EXEMPLOS", "APLICAÇÕES"],
    years: [9, 10],
    hintTitle: "EXPERIMENTE",
    hint: "Arraste os pontos ou ajuste os valores de a e b para ver como a relação se mantém.",
  },
  "geo-angles": {
    id: "geo-angles",
    nodeId: "geo-angles",
    eyebrow: "GEOMETRIA",
    title: "ÂNGULOS",
    shortTitle: "Ângulos",
    explanation:
      "Um ângulo mede a abertura entre duas semirretas que partem do mesmo ponto. A medida diz o quanto é preciso girar de uma para a outra.",
    equation: "0° ≤ α ≤ 360°",
    legend: [
      { symbol: "○", filled: false, label: "vértice", detail: "ponto de encontro das semirretas" },
      {
        symbol: "●",
        filled: true,
        label: "α",
        detail: "abertura medida em graus",
        emphasis: true,
      },
    ],
    journey: ["EXPLORAR", "ENTENDER", "EXEMPLOS", "APLICAÇÕES"],
    years: [6, 7],
    hintTitle: "EXPERIMENTE",
    hint: "Arraste a semirreta móvel e observe quando o ângulo muda de classificação.",
  },
  "geo-area": {
    id: "geo-area",
    nodeId: "geo-area",
    eyebrow: "MEDIDAS",
    title: "ÁREA",
    shortTitle: "Área",
    explanation:
      "Área é a quantidade de superfície que uma figura ocupa. Ela se mede contando quantos quadrados unitários cabem dentro da figura.",
    equation: "A = b × h",
    legend: [
      { symbol: "□", filled: false, label: "unidade", detail: "quadrado de 1 cm de lado" },
      {
        symbol: "■",
        filled: true,
        label: "cobertura",
        detail: "quantidade de unidades que cabem dentro",
        emphasis: true,
      },
    ],
    journey: ["EXPLORAR", "ENTENDER", "EXEMPLOS", "APLICAÇÕES"],
    years: [7, 8],
    hintTitle: "EXPERIMENTE",
    hint: "Mude a base e a altura e conte as unidades cobertas antes de olhar a fórmula.",
  },
  "geo-perimeter": {
    id: "geo-perimeter",
    nodeId: "geo-perimeter",
    eyebrow: "MEDIDAS",
    title: "PERÍMETRO",
    shortTitle: "Perímetro",
    explanation:
      "Perímetro é o comprimento do contorno de uma figura. Não depende do que está dentro, apenas do caminho que cerca a figura.",
    equation: "P = soma dos lados",
    legend: [
      { symbol: "○", filled: false, label: "vértices", detail: "arraste para deformar a figura" },
      {
        symbol: "—",
        filled: true,
        label: "contorno",
        detail: "o perímetro percorre o exterior",
        emphasis: true,
      },
    ],
    journey: ["EXPLORAR", "ENTENDER", "EXEMPLOS", "APLICAÇÕES"],
    years: [6, 7],
    hintTitle: "EXPERIMENTE",
    hint: "Arraste os vértices e veja o perímetro mudar enquanto a área pode permanecer parecida.",
  },
  "geo-triangles": {
    id: "geo-triangles",
    nodeId: "geo-triangles",
    eyebrow: "GEOMETRIA",
    title: "TRIÂNGULOS",
    shortTitle: "Triângulos",
    explanation:
      "Um triângulo tem três lados e três ângulos internos. A soma de seus ângulos é sempre 180°.",
    equation: "α + β + γ = 180°",
    legend: [
      { symbol: "○", filled: false, label: "lados", detail: "classificação pelos lados" },
      {
        symbol: "●",
        filled: true,
        label: "ângulos",
        detail: "classificação pelos ângulos",
        emphasis: true,
      },
    ],
    journey: ["EXPLORAR", "ENTENDER", "EXEMPLOS", "APLICAÇÕES"],
    years: [7, 8],
    hintTitle: "EXPERIMENTE",
    hint: "Arraste um vértice e veja a classificação e a soma dos ângulos se manterem coerentes.",
  },
};

export function conceptByNodeId(nodeId: string): ConceptDefinition | null {
  return (
    Object.values(CONCEPTS).find((concept) => concept.nodeId === nodeId) ?? null
  );
}
