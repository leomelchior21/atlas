import type { DomainSeed } from "./layout";

export const CHEMISTRY_ID = "chemistry-root";

export const CHEMISTRY_DOMAINS: DomainSeed[] = [
  {
    id: "chem-matter",
    title: "MATÉRIA",
    years: [9],
    children: [
      { id: "chem-substancias", title: "Substâncias" },
      { id: "chem-misturas", title: "Misturas" },
      { id: "chem-separacao", title: "Separação" },
      { id: "chem-transformacoes", title: "Transformações" },
    ],
  },
  {
    id: "chem-atomic",
    title: "ESTRUTURA ATÔMICA",
    years: [9, 10],
    children: [
      { id: "chem-atomo", title: "Átomo", connects: ["num-notacao"] },
      { id: "chem-particulas", title: "Partículas" },
      { id: "chem-isotopos", title: "Isótopos" },
      { id: "chem-distribuicao", title: "Distribuição eletrônica" },
    ],
  },
  {
    id: "chem-periodic",
    title: "TABELA PERIÓDICA",
    years: [9, 10],
    children: [
      { id: "chem-periodos", title: "Períodos" },
      { id: "chem-familias", title: "Famílias" },
      { id: "chem-propriedades", title: "Propriedades" },
      { id: "chem-tendencias", title: "Tendências" },
    ],
  },
  {
    id: "chem-bonds",
    title: "LIGAÇÕES QUÍMICAS",
    years: [10],
    children: [
      { id: "chem-ionica", title: "Iônica" },
      { id: "chem-covalente", title: "Covalente" },
      { id: "chem-metalica", title: "Metálica" },
      { id: "chem-geometria", title: "Geometria molecular" },
    ],
  },
  {
    id: "chem-reactions",
    title: "REAÇÕES",
    years: [10],
    children: [
      { id: "chem-equacoes", title: "Equações" },
      { id: "chem-balanceamento", title: "Balanceamento" },
      { id: "chem-tipos", title: "Tipos de reação" },
      { id: "chem-oxirreducao", title: "Oxirredução" },
    ],
  },
  {
    id: "chem-stoich",
    title: "ESTEQUIOMETRIA",
    years: [11],
    children: [
      { id: "chem-mol", title: "Mol" },
      { id: "chem-massa", title: "Massa molar", connects: ["num-proporcao"] },
      { id: "chem-calculos", title: "Cálculos" , connects: ["num-proporcao"]},
      { id: "chem-reagente", title: "Reagente limitante" },
    ],
  },
  {
    id: "chem-solutions",
    title: "SOLUÇÕES",
    years: [11],
    children: [
      { id: "chem-concentracao", title: "Concentração" },
      { id: "chem-molaridade", title: "Molaridade" },
      { id: "chem-diluicao", title: "Diluição" },
      { id: "chem-mistura-solucoes", title: "Mistura de soluções" },
    ],
  },
  {
    id: "chem-acids",
    title: "ÁCIDOS E BASES",
    years: [11],
    children: [
      { id: "chem-ph", title: "pH" },
      { id: "chem-neutralizacao", title: "Neutralização" },
      { id: "chem-indicadores", title: "Indicadores" },
    ],
  },
  {
    id: "chem-thermo",
    title: "TERMOQUÍMICA",
    years: [12],
    children: [
      { id: "chem-entalpia", title: "Entalpia" },
      { id: "chem-exotermica", title: "Exotérmica" },
      { id: "chem-endotermica", title: "Endotérmica" },
      { id: "chem-lei-hess", title: "Lei de Hess" },
    ],
  },
  {
    id: "chem-organic",
    title: "QUÍMICA ORGÂNICA",
    years: [12],
    children: [
      { id: "chem-carbono", title: "Carbono" },
      { id: "chem-cadeias", title: "Cadeias" },
      { id: "chem-funcoes", title: "Funções orgânicas" },
      { id: "chem-isomeria", title: "Isomeria" },
    ],
  },
];
