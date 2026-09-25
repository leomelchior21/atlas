import type { DomainSeed } from "./layout";

export const PHYSICS_ID = "physics-root";

export const PHYSICS_DOMAINS: DomainSeed[] = [
  {
    id: "phy-motion",
    title: "MOVIMENTO",
    years: [9, 10],
    children: [
      { id: "phy-mru", title: "MRU", connects: ["func-afim"] },
      { id: "phy-mruv", title: "MRUV", connects: ["func-quadratica"] },
      { id: "phy-queda", title: "Queda livre" },
      { id: "phy-lancamento", title: "Lançamento" },
      { id: "phy-circular", title: "Movimento circular" },
      { id: "phy-vectors", title: "Vetores", connects: ["geo-pythagoras", "trig-seno"] },
    ],
  },
  {
    id: "phy-forces",
    title: "FORÇAS",
    years: [9, 10, 11],
    children: [
      { id: "phy-leis-newton", title: "Leis de Newton" },
      { id: "phy-atrito", title: "Atrito" },
      { id: "phy-plano-inclinado", title: "Plano inclinado" },
      { id: "phy-gravitacao", title: "Gravitação" },
      { id: "phy-estatica", title: "Estática" },
    ],
  },
  {
    id: "phy-energy",
    title: "ENERGIA",
    years: [10, 11],
    children: [
      { id: "phy-trabalho", title: "Trabalho" },
      { id: "phy-cinetica", title: "Energia cinética" },
      { id: "phy-potencial", title: "Energia potencial" },
      { id: "phy-conservacao", title: "Conservação" },
      { id: "phy-potencia", title: "Potência" },
    ],
  },
  {
    id: "phy-waves",
    title: "ONDAS",
    years: [11],
    children: [
      { id: "phy-ondulatoria", title: "Ondulatória" },
      { id: "phy-som", title: "Som" },
      { id: "phy-luz", title: "Luz" },
      { id: "phy-interferencia", title: "Interferência" },
      { id: "phy-ressonancia", title: "Ressonância" },
    ],
  },
  {
    id: "phy-electricity",
    title: "ELETRICIDADE",
    years: [10, 11, 12],
    children: [
      { id: "phy-carga", title: "Carga elétrica" },
      { id: "phy-corrente", title: "Corrente" },
      { id: "phy-tensao", title: "Tensão" },
      { id: "phy-resistencia", title: "Resistência" },
      { id: "phy-circuitos", title: "Circuitos" },
      { id: "phy-magnetismo", title: "Magnetismo" },
    ],
  },
  {
    id: "phy-heat",
    title: "CALOR",
    years: [10, 11],
    children: [
      { id: "phy-temperatura", title: "Temperatura" },
      { id: "phy-calorimetria", title: "Calorimetria" },
      { id: "phy-dilatacao", title: "Dilatação" },
      { id: "phy-gases", title: "Gases" },
      { id: "phy-termodinamica", title: "Termodinâmica" },
    ],
  },
  {
    id: "phy-optics",
    title: "ÓPTICA",
    years: [11],
    children: [
      { id: "phy-reflexao", title: "Reflexão" },
      { id: "phy-refracao", title: "Refração" },
      { id: "phy-lentes", title: "Lentes" },
      { id: "phy-espelhos", title: "Espelhos" },
      { id: "phy-instrumentos", title: "Instrumentos ópticos" },
    ],
  },
  {
    id: "phy-matter",
    title: "MATÉRIA",
    years: [9, 10],
    children: [
      { id: "phy-estados", title: "Estados físicos" },
      { id: "phy-densidade", title: "Densidade" },
      { id: "phy-pressao", title: "Pressão" },
      { id: "phy-fluidos", title: "Fluidos" },
    ],
  },
];
