import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AtlasProvider } from "@/store/atlas-store";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { MindMap } from "@/components/atlas/MindMap";
import { ConceptLanding } from "@/components/atlas/ConceptLanding";
import { PlaceholderView } from "@/components/concept/PlaceholderView";
import { ConceptView } from "@/components/concept/ConceptView";
import { MarathonView } from "@/components/marathon/MarathonView";
import { ProblemDiagram } from "@/components/geometry/ProblemDiagram";
import { ATLAS } from "@/content";
import { getPack } from "@/engine/problems/registry";
import { generateFromPack } from "@/engine/problems/engine";
import type { FunctionalConceptId } from "@/types/content";

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(<AtlasProvider>{element}</AtlasProvider>);
}

const CONCEPTS: FunctionalConceptId[] = [
  "geo-pythagoras",
  "geo-angles",
  "geo-area",
  "geo-perimeter",
  "geo-triangles",
];

describe("renderização das telas", () => {
  it("renderiza o onboarding", () => {
    const html = render(<Onboarding onComplete={() => {}} />);
    expect(html).toContain("Como podemos");
    expect(html).toContain("ATLAS");
  });

  const mapProps = {
    focus: null,
    studentYear: 8,
    masteryByNode: {},
    explored: [],
    selectedId: null,
    onSelect: () => {},
    onToggleExpanded: () => {},
    onSetExpanded: () => {},
    onClearSelection: () => {},
    onOpen: () => {},
  };

  it("renderiza o mapa mental com as três ilhas", () => {
    const html = render(<MindMap {...mapProps} expanded={["__atlas"]} />);
    expect(html).toContain("MATEMÁTICA");
    expect(html).toContain("FÍSICA");
    expect(html).toContain("QUÍMICA");
    expect(html).toContain("ENCONTRE SUA ILHA");
  });

  it("abre um nível de cada vez", () => {
    const closed = render(<MindMap {...mapProps} expanded={["__atlas"]} />);
    expect(closed).not.toContain("NÚMEROS");
    expect(closed).not.toContain("GEOMETRIA");

    const opened = render(
      <MindMap {...mapProps} expanded={["__atlas", "math-root"]} />,
    );
    expect(opened).toContain("NÚMEROS");
    expect(opened).toContain("GEOMETRIA");
    expect(opened).not.toContain("Pitágoras");
  });

  it("renderiza a tela de entrada do conceito", () => {
    const html = render(<ConceptLanding nodeId="geo-pythagoras" />);
    expect(html).toContain("CONCEITO");
    expect(html).toContain("MARATONA");
    expect(html).toContain("PITÁGORAS");
    expect(html).toContain("← VOLTAR AO MAPA");

    const withBranches = render(<ConceptLanding nodeId="geo-triangles" />);
    expect(withBranches).toContain("TRIÂNGULOS");
    expect(withBranches).toContain("EXPLORAR RAMIFICAÇÕES");
  });

  it("renderiza o estado de território em mapeamento", () => {
    const html = render(<PlaceholderView nodeId="geo-space" onBack={() => {}} />);
    expect(html).toContain("ESTE TERRITÓRIO AINDA ESTÁ SENDO MAPEADO");
    expect(html).toContain("EM BREVE");
  });

  it.each(CONCEPTS)("renderiza a experiência de %s", (conceptId) => {
    const html = render(<ConceptView conceptId={conceptId} onLeave={() => {}} />);
    expect(html.length).toBeGreaterThan(2000);
    expect(html).toContain("EXPLORAR");
    expect(html).toContain("APLICAÇÕES");
  });

  it("renderiza a maratona", () => {
    const html = render(<MarathonView onExit={() => {}} />);
    expect(html).toContain("MARATONA");
    expect(html).toContain("LEVE");
    expect(html).toContain("NORMAL");
    expect(html).toContain("AVANÇADA");
  });
});

describe("diagramas de problema", () => {
  it("renderiza todos os tipos de diagrama", () => {
    const kinds = [
      { kind: "right-triangle" as const, legA: 6, legB: 8, labelA: "6", labelB: "8", labelC: "x" },
      {
        kind: "triangle-sides" as const,
        sides: [3, 4, 5] as [number, number, number],
        labels: ["3", "4", "5"] as [string, string, string],
      },
      {
        kind: "rectangle" as const,
        width: 8,
        height: 5,
        labelWidth: "8",
        labelHeight: "5",
        diagonal: true,
        labelDiagonal: "d",
      },
      { kind: "polygon" as const, sides: [8, 4, 4, 4] },
      { kind: "angle" as const, degrees: 120, label: "120°" },
      { kind: "circle" as const, radiusLabel: "r", showDiameter: true },
      { kind: "l-shape" as const, width: 10, height: 8, cutWidth: 3, cutHeight: 3 },
      { kind: "none" as const },
    ];
    for (const spec of kinds) {
      const html = renderToStaticMarkup(<ProblemDiagram spec={spec} />);
      expect(html.length).toBeGreaterThan(20);
      if (spec.kind !== "none") expect(html).toContain("<svg");
    }
  });

  it("renderiza diagramas gerados pelo motor", () => {
    for (const conceptId of Object.keys({ "geo-pythagoras": 1, "geo-area": 1, "geo-perimeter": 1, "geo-triangles": 1 })) {
      const pack = getPack(conceptId)!;
      const report = generateFromPack(pack, { difficulty: "normal", seed: `${pack.seedPrefix}-DIAG` });
      if (!report.problem) continue;
      const html = renderToStaticMarkup(<ProblemDiagram spec={report.problem.diagram} />);
      expect(html).toContain("<svg");
    }
  });
});

describe("grafo de conteúdo", () => {
  it("mantém todos os pais válidos", () => {
    for (const node of ATLAS.nodes) {
      if (!node.parentId) continue;
      expect(ATLAS.byId[node.parentId], `pai ausente para ${node.id}`).toBeTruthy();
    }
  });

  it("mantém as conexões dentro do grafo", () => {
    for (const node of ATLAS.nodes) {
      for (const target of node.connections) {
        expect(ATLAS.byId[target], `${node.id} → ${target}`).toBeTruthy();
      }
    }
  });

  it("posiciona as três ilhas separadamente", () => {
    const [math, physics, chemistry] = ATLAS.subjects;
    expect(ATLAS.subjects.length).toBe(3);
    expect(ATLAS.world[math.id].x).toBe(0);
    expect(ATLAS.world[physics.id].x).toBeLessThan(-1500);
    expect(ATLAS.world[chemistry.id].x).toBeGreaterThan(1500);
  });

  it("mantém as posições determinísticas entre execuções", () => {
    const geo = ATLAS.world["geo"];
    const triangles = ATLAS.world["geo-triangles"];
    const pythagoras = ATLAS.world["geo-pythagoras"];
    expect(geo).toEqual({ x: 356, y: 18 });
    expect(Math.round(triangles.x)).toBe(474);
    expect(Math.round(pythagoras.y)).toBe(230);
  });

  it("exige que toda geometria funcional tenha pack de problemas", () => {
    for (const node of ATLAS.nodes) {
      if (!node.hasConcept || !node.conceptId) continue;
      expect(getPack(node.conceptId), `pack para ${node.conceptId}`).toBeTruthy();
    }
  });
});
