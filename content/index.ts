import {
  buildChildNodes,
  buildDomainNodes,
  buildSubjectNodes,
  fanPhase,
  SUBJECT_ORIGIN,
  type DomainSeed,
  type NodeSeed,
} from "./layout";
import { CHEMISTRY_DOMAINS, CHEMISTRY_ID } from "./chemistry";
import { MATH_DOMAINS, MATH_ID } from "./math";
import { PHYSICS_DOMAINS, PHYSICS_ID } from "./physics";
import type { AtlasGraph, AtlasNode, Vec2 } from "@/types/content";

function expand(domain: AtlasNode, seeds: NodeSeed[]): AtlasNode[] {
  if (!seeds.length) return [];
  const topics = buildChildNodes(domain, seeds, 2, fanPhase(seeds.length, 1));
  const out: AtlasNode[] = [];
  for (const topic of topics) {
    out.push(topic);
    const source = seeds.find((s) => s.id === topic.id);
    if (source?.children?.length) {
      out.push(
        ...buildChildNodes(
          topic,
          source.children,
          3,
          fanPhase(source.children.length, topic.id.length),
        ),
      );
    }
  }
  return out;
}

function buildSubject(
  subject: "math" | "physics" | "chemistry",
  id: string,
  title: string,
  domains: DomainSeed[],
): AtlasNode[] {
  const root = buildSubjectNodes(subject, SUBJECT_ORIGIN[id], id, title);
  const domainNodes = buildDomainNodes(
    subject,
    domains,
    id,
    subject === "math" ? "math" : "ring",
  );
  const nodes: AtlasNode[] = [root, ...domainNodes];
  for (let i = 0; i < domains.length; i++) {
    nodes.push(...expand(domainNodes[i], domains[i].children));
  }
  return nodes;
}

function assemble(): AtlasGraph {
  const nodes = [
    ...buildSubject("math", MATH_ID, "MATEMÁTICA", MATH_DOMAINS),
    ...buildSubject("physics", PHYSICS_ID, "FÍSICA", PHYSICS_DOMAINS),
    ...buildSubject("chemistry", CHEMISTRY_ID, "QUÍMICA", CHEMISTRY_DOMAINS),
  ];

  const byId: Record<string, AtlasNode> = {};
  for (const node of nodes) byId[node.id] = node;

  const childrenOf: Record<string, AtlasNode[]> = {};
  for (const node of nodes) {
    if (!node.parentId) continue;
    (childrenOf[node.parentId] ??= []).push(node);
  }

  const world: Record<string, Vec2> = {};
  const resolve = (id: string): Vec2 => {
    if (world[id]) return world[id];
    const node = byId[id];
    if (!node) return { x: 0, y: 0 };
    const base = node.parentId ? resolve(node.parentId) : { x: 0, y: 0 };
    const point = node.parentId
      ? { x: base.x + node.position.x, y: base.y + node.position.y }
      : { ...node.position };
    world[id] = point;
    return point;
  };
  for (const node of nodes) resolve(node.id);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const p = world[node.id];
    const pad =
      node.depth === 0 ? 300 : node.depth === 1 ? 200 : node.depth === 2 ? 120 : 60;
    minX = Math.min(minX, p.x - pad);
    maxX = Math.max(maxX, p.x + pad);
    minY = Math.min(minY, p.y - pad);
    maxY = Math.max(maxY, p.y + pad);
  }

  for (const node of nodes) {
    node.connections = node.connections.filter((target) => Boolean(byId[target]));
  }

  const order = [...nodes].sort((a, b) => a.depth - b.depth).map((n) => n.id);

  return {
    nodes,
    byId,
    subjects: nodes.filter((n) => n.depth === 0),
    childrenOf,
    world,
    order,
    bounds: { minX, maxX, minY, maxY },
  };
}

export const ATLAS: AtlasGraph = assemble();

export function nodeById(id: string | null | undefined): AtlasNode | undefined {
  if (!id) return undefined;
  return ATLAS.byId[id];
}

export const SUBJECT_ROOT_IDS = [MATH_ID, PHYSICS_ID, CHEMISTRY_ID];

export function ancestorsOf(id: string): AtlasNode[] {
  const chain: AtlasNode[] = [];
  let current = ATLAS.byId[id];
  while (current?.parentId) {
    const parent = ATLAS.byId[current.parentId];
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function descendantIds(id: string): string[] {
  const out: string[] = [];
  const walk = (nodeId: string) => {
    for (const child of ATLAS.childrenOf[nodeId] ?? []) {
      out.push(child.id);
      walk(child.id);
    }
  };
  walk(id);
  return out;
}

export function pathToNode(id: string): AtlasNode[] {
  const node = ATLAS.byId[id];
  if (!node) return [];
  return [...ancestorsOf(id), node];
}

/** the chain of ancestors that must stay visible while a node is focused */
export function isInLineage(nodeId: string, focusId: string | null): boolean {
  if (!focusId) return false;
  if (nodeId === focusId) return true;
  return ancestorsOf(focusId).some((ancestor) => ancestor.id === nodeId);
}
