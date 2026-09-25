export interface Point {
  x: number;
  y: number;
}

export const EPS = 1e-9;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function radians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function nearlyEqual(a: number, b: number, tolerance = 1e-6): boolean {
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Point, k: number): Point {
  return { x: a.x * k, y: a.y * k };
}

export function magnitude(v: Point): number {
  return Math.hypot(v.x, v.y);
}

export function normalize(v: Point): Point {
  const len = magnitude(v);
  if (len < EPS) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function rotate(point: Point, angle: number, origin: Point = { x: 0, y: 0 }): Point {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: origin.x + dx * cos - dy * sin, y: origin.y + dx * sin + dy * cos };
}

/** signed angle from vector a to vector b, in radians (-PI..PI) */
export function signedAngleBetween(a: Point, b: Point): number {
  return Math.atan2(cross(a, b), dot(a, b));
}

/** interior angle at vertex formed by the points p1-v-p2, in radians (0..PI) */
export function angleAtVertex(p1: Point, vertex: Point, p2: Point): number {
  const a = subtract(p1, vertex);
  const b = subtract(p2, vertex);
  const denom = magnitude(a) * magnitude(b);
  if (denom < EPS) return 0;
  return Math.acos(clamp(dot(a, b) / denom, -1, 1));
}

export function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs(cross(subtract(b, a), subtract(c, a))) / 2;
}

export function polygonPerimeter(points: Point[], closed = true): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) total += distance(points[i], points[i + 1]);
  if (closed && points.length > 2) total += distance(points[points.length - 1], points[0]);
  return total;
}

export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function polygonIsSimple(points: Point[], tolerance = 1e-7): boolean {
  const n = points.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a1 = points[i];
      const a2 = points[(i + 1) % n];
      const b1 = points[j];
      const b2 = points[(j + 1) % n];
      if (i === j) continue;
      if ((i + 1) % n === j || (j + 1) % n === i) continue;
      if (segmentsIntersect(a1, a2, b1, b2, tolerance)) return false;
    }
  }
  return true;
}

export function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point, tolerance = 0): boolean {
  const d1 = cross(subtract(b2, b1), subtract(a1, b1));
  const d2 = cross(subtract(b2, b1), subtract(a2, b1));
  const d3 = cross(subtract(a2, a1), subtract(b1, a1));
  const d4 = cross(subtract(a2, a1), subtract(b2, a1));
  if (((d1 > tolerance && d2 < -tolerance) || (d1 < -tolerance && d2 > tolerance)) &&
      ((d3 > tolerance && d4 < -tolerance) || (d3 < -tolerance && d4 > tolerance))) {
    return true;
  }
  return false;
}

export function triangleInequality(a: number, b: number, c: number, tolerance = 1e-9): boolean {
  return a + b > c + tolerance && a + c > b + tolerance && b + c > a + tolerance;
}

export function isRightTriangle(a: number, b: number, c: number, tolerance = 1e-6): boolean {
  const sides = [a, b, c].sort((x, y) => x - y);
  const [l1, l2, hyp] = sides;
  return Math.abs(l1 * l1 + l2 * l2 - hyp * hyp) <= tolerance * Math.max(1, hyp * hyp);
}

export function pythagoreanHypotenuse(a: number, b: number): number {
  return Math.sqrt(a * a + b * b);
}

export function missingLeg(hypotenuse: number, leg: number): number {
  return Math.sqrt(Math.max(0, hypotenuse * hypotenuse - leg * leg));
}

/** unit direction from a to b */
export function direction(a: Point, b: Point): Point {
  return normalize(subtract(b, a));
}

/** outward unit normal of segment a->b (rotated -90°) */
export function normal(a: Point, b: Point): Point {
  const d = direction(a, b);
  return { x: d.y, y: -d.x };
}

/** places a square on segment a-b, on the side determined by sign (+1 / -1) */
export function squareOnSegment(a: Point, b: Point, sign: 1 | -1): [Point, Point, Point, Point] {
  const n = normal(a, b);
  const len = distance(a, b);
  const offset = scale(n, sign * len);
  return [a, b, add(b, offset), add(a, offset)];
}

/** polygon that is the rectangle offset to the right of a-b with depth d */
export function rectangleOnSegment(a: Point, b: Point, depth: number): [Point, Point, Point, Point] {
  const n = normal(a, b);
  const offset = scale(n, depth);
  return [a, b, add(b, offset), add(a, offset)];
}

export function projectPointOnSegment(p: Point, a: Point, b: Point): Point {
  const ab = subtract(b, a);
  const lenSq = dot(ab, ab);
  if (lenSq < EPS) return a;
  const t = clamp(dot(subtract(p, a), ab) / lenSq, 0, 1);
  return add(a, scale(ab, t));
}

export function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  return distance(p, projectPointOnSegment(p, a, b));
}

export function boundingBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

export function classifyTriangleSides(a: number, b: number, c: number, tolerance = 1e-9): string {
  if (nearlyEqual(a, b, 1e-6) && nearlyEqual(b, c, 1e-6)) return "Equilátero";
  if (nearlyEqual(a, b, 1e-6) || nearlyEqual(b, c, 1e-6) || nearlyEqual(a, c, 1e-6)) return "Isósceles";
  return "Escaleno";
}

export function classifyAngle(deg: number, tolerance = 0.75): string {
  if (Math.abs(deg - 90) <= tolerance) return "reto";
  if (Math.abs(deg - 180) <= tolerance) return "raso";
  if (Math.abs(deg) <= tolerance) return "nulo";
  if (deg < 90) return "agudo";
  return "obtuso";
}

/** point along a circle, measured clockwise from the positive x axis */
export function polar(origin: Point, radius: number, angle: number): Point {
  return { x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius };
}
