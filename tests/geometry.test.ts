import { describe, expect, it } from "vitest";
import {
  angleAtVertex,
  boundingBox,
  classifyAngle,
  classifyTriangleSides,
  degrees,
  distance,
  isRightTriangle,
  missingLeg,
  nearlyEqual,
  pointToSegmentDistance,
  polygonArea,
  polygonIsSimple,
  polygonPerimeter,
  pythagoreanHypotenuse,
  radians,
  triangleArea,
  triangleInequality,
} from "@/lib/geometry";

describe("geometria básica", () => {
  it("calcula distância e ponto médio", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance({ x: -1, y: -1 }, { x: 1, y: 1 })).toBeCloseTo(2.8284271, 6);
  });

  it("converte graus e radianos", () => {
    expect(degrees(Math.PI)).toBeCloseTo(180, 9);
    expect(radians(180)).toBeCloseTo(Math.PI, 9);
  });

  it("calcula área do triângulo", () => {
    expect(triangleArea({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 })).toBe(6);
    expect(triangleArea({ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBe(0);
  });

  it("calcula perímetro e área de polígonos", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 3 },
    ];
    expect(polygonPerimeter(square)).toBe(12);
    expect(polygonArea(square)).toBe(9);
  });

  it("detecta polígonos simples", () => {
    const simple = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    const crossed = [
      { x: 0, y: 0 },
      { x: 4, y: 4 },
      { x: 4, y: 0 },
      { x: 0, y: 4 },
    ];
    expect(polygonIsSimple(simple)).toBe(true);
    expect(polygonIsSimple(crossed)).toBe(false);
  });

  it("mede ângulo entre segmentos", () => {
    const angle = degrees(angleAtVertex({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }));
    expect(angle).toBeCloseTo(90, 9);
  });

  it("classifica ângulos", () => {
    expect(classifyAngle(45)).toBe("agudo");
    expect(classifyAngle(90)).toBe("reto");
    expect(classifyAngle(90.2)).toBe("reto");
    expect(classifyAngle(120)).toBe("obtuso");
    expect(classifyAngle(180)).toBe("raso");
    expect(classifyAngle(0)).toBe("nulo");
  });

  it("classifica triângulos pelos lados", () => {
    expect(classifyTriangleSides(5, 5, 5)).toBe("Equilátero");
    expect(classifyTriangleSides(5, 5, 8)).toBe("Isósceles");
    expect(classifyTriangleSides(3, 4, 5)).toBe("Escaleno");
  });

  it("valida a desigualdade triangular", () => {
    expect(triangleInequality(3, 4, 5)).toBe(true);
    expect(triangleInequality(1, 2, 5)).toBe(false);
  });

  it("reconhece triângulos retângulos", () => {
    expect(isRightTriangle(3, 4, 5)).toBe(true);
    expect(isRightTriangle(6, 8, 10)).toBe(true);
    expect(isRightTriangle(3, 4, 6)).toBe(false);
  });

  it("calcula hipotenusa e cateto", () => {
    expect(pythagoreanHypotenuse(3, 4)).toBeCloseTo(5, 9);
    expect(pythagoreanHypotenuse(5, 12)).toBeCloseTo(13, 9);
    expect(missingLeg(13, 5)).toBeCloseTo(12, 9);
    expect(missingLeg(5, 4)).toBeCloseTo(3, 9);
    expect(missingLeg(3, 4)).toBe(0);
  });

  it("mede distância de ponto a segmento", () => {
    expect(pointToSegmentDistance({ x: 0, y: 5 }, { x: -10, y: 0 }, { x: 10, y: 0 })).toBe(5);
    expect(pointToSegmentDistance({ x: 20, y: 0 }, { x: -10, y: 0 }, { x: 10, y: 0 })).toBe(10);
  });

  it("produz caixa envolvente", () => {
    const box = boundingBox([
      { x: -2, y: 4 },
      { x: 6, y: -3 },
    ]);
    expect(box).toEqual({ minX: -2, minY: -3, maxX: 6, maxY: 4 });
  });

  it("compara números com tolerância", () => {
    expect(nearlyEqual(1, 1 + 1e-12)).toBe(true);
    expect(nearlyEqual(1, 1.001, 1e-6)).toBe(false);
  });
});
