"use client";

import type { FunctionalConceptId } from "@/types/content";
import { AnglesConcept } from "./AnglesConcept";
import { AreaConcept } from "./AreaConcept";
import { PerimeterConcept } from "./PerimeterConcept";
import { PythagorasConcept } from "./PythagorasConcept";
import { TrianglesConcept } from "./TrianglesConcept";

export function ConceptView({
  conceptId,
  onLeave,
}: {
  conceptId: FunctionalConceptId;
  onLeave: () => void;
}) {
  switch (conceptId) {
    case "geo-pythagoras":
      return <PythagorasConcept onLeave={onLeave} />;
    case "geo-angles":
      return <AnglesConcept onLeave={onLeave} />;
    case "geo-area":
      return <AreaConcept onLeave={onLeave} />;
    case "geo-perimeter":
      return <PerimeterConcept onLeave={onLeave} />;
    case "geo-triangles":
      return <TrianglesConcept onLeave={onLeave} />;
    default:
      return null;
  }
}
