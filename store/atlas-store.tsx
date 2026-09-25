"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ATLAS, subtreeBounds } from "@/content";
import { TIER_THRESHOLDS } from "@/content/layout";
import { computeMastery, type MasteryBreakdown } from "@/engine/mastery";
import {
  localRepository,
  markExplored,
  recordAnswer,
  recordSignature,
  setStudent,
  startSession,
  type AnswerInput,
} from "@/engine/progress/store";
import { emptyProgress, type AtlasProgress } from "@/engine/progress/types";
import { PROBLEM_PACKS } from "@/engine/problems/registry";
import type { DifficultyId, GeneratedProblem } from "@/engine/problems/types";
import type { AtlasNode, FunctionalConceptId } from "@/types/content";

export type AtlasView =
  | { kind: "map" }
  | { kind: "chooser"; nodeId: string }
  | { kind: "concept"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "marathon"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "placeholder"; nodeId: string };

export interface FocusRequest {
  nodeId: string;
  scale: number;
  nonce: number;
}

interface AtlasContextValue {
  ready: boolean;
  progress: AtlasProgress;
  view: AtlasView;
  difficulty: DifficultyId;
  focus: FocusRequest | null;
  studentName: string;
  studentYear: number;
  xp: number;
  actions: {
    completeOnboarding: (name: string, year: number) => void;
    setDifficulty: (difficulty: DifficultyId) => void;
    openNode: (nodeId: string) => void;
    requestFocus: (nodeId: string, scale: number) => void;
    openConcept: (nodeId: string) => void;
    exploreChildren: (nodeId: string) => void;
    openMarathon: (nodeId: string) => void;
    backToMap: () => void;
    backToChooser: () => void;
    answerQuestion: (input: AnswerInput) => void;
    rememberSignature: (problem: GeneratedProblem) => void;
    beginSession: (conceptId: string) => void;
    resetProgress: () => void;
  };
}

const AtlasContext = createContext<AtlasContextValue | null>(null);

/* ------------------------------------------------------ progress external store */

let state: AtlasProgress = emptyProgress();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return state;
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  state = localRepository.load();
  emit();
}

function commit(next: AtlasProgress) {
  state = next;
  localRepository.save(next);
  emit();
}

/** test helper: drops the in-memory snapshot so a fresh repository read happens */
export function __resetAtlasStore() {
  state = emptyProgress();
  hydrated = false;
  emit();
}

/* ------------------------------------------------------------- helpers */

export function conceptScaleFor(node: AtlasNode): number {
  if (node.depth === 0) return TIER_THRESHOLDS[0] * 1.18;
  if (node.depth === 1) return TIER_THRESHOLDS[1] * 1.2;
  if (node.depth === 2) return TIER_THRESHOLDS[2] * 1.18;
  return TIER_THRESHOLDS[2] * 1.7;
}

export function hasChildren(nodeId: string): boolean {
  return (ATLAS.childrenOf[nodeId] ?? []).length > 0;
}

export function subtreeFitScale(nodeId: string, viewport: { w: number; h: number }): number {
  const target = ATLAS.byId[nodeId];
  if (target && !hasChildren(nodeId)) return conceptScaleFor(target);
  const bounds = subtreeBounds(nodeId);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const raw = Math.min((viewport.w * 0.82) / width, (viewport.h * 0.78) / height);
  const node = ATLAS.byId[nodeId];
  const min =
    node.depth === 0 ? TIER_THRESHOLDS[0] * 1.12 : node.depth === 1 ? TIER_THRESHOLDS[1] * 1.15 : TIER_THRESHOLDS[2] * 1.1;
  return Math.max(min, Math.min(raw, 6.5));
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<AtlasView>({ kind: "map" });
  const [difficulty, setDifficultyState] = useState<DifficultyId>("normal");
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const nonce = useRef(0);

  useEffect(() => {
    hydrate();
    const handle = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(handle);
  }, []);

  const requestFocus = useCallback((nodeId: string, scale: number) => {
    nonce.current += 1;
    setFocus({ nodeId, scale, nonce: nonce.current });
  }, []);

  const openNode = useCallback(
    (nodeId: string) => {
      const node = ATLAS.byId[nodeId];
      if (!node) return;
      const viewport = {
        w: typeof window === "undefined" ? 1366 : window.innerWidth,
        h: typeof window === "undefined" ? 768 : window.innerHeight,
      };
      if (node.hasConcept && node.conceptId) {
        requestFocus(nodeId, subtreeFitScale(nodeId, viewport));
        setView({ kind: "chooser", nodeId });
        commit(markExplored(state, nodeId, node.conceptId));
        return;
      }
      if (hasChildren(nodeId)) {
        setView({ kind: "map" });
        requestFocus(nodeId, subtreeFitScale(nodeId, viewport));
        commit(markExplored(state, nodeId));
        return;
      }
      commit(markExplored(state, nodeId));
      setView({ kind: "placeholder", nodeId });
    },
    [requestFocus],
  );

  const backToMap = useCallback(() => {
    setView({ kind: "map" });
    const node = view.kind !== "map" ? ATLAS.byId[view.nodeId] : undefined;
    if (node && node.depth > 0) requestFocus(node.id, conceptScaleFor(node));
  }, [requestFocus, view]);

  const backToChooser = useCallback(() => {
    if (view.kind === "map") return;
    const node = ATLAS.byId[view.nodeId];
    if (!node) {
      setView({ kind: "map" });
      return;
    }
    setView({ kind: "chooser", nodeId: node.id });
    requestFocus(node.id, conceptScaleFor(node));
  }, [requestFocus, view]);

  const exploreChildren = useCallback(
    (nodeId: string) => {
      const node = ATLAS.byId[nodeId];
      if (!node || !hasChildren(nodeId)) return;
      const viewport = {
        w: typeof window === "undefined" ? 1366 : window.innerWidth,
        h: typeof window === "undefined" ? 768 : window.innerHeight,
      };
      setView({ kind: "map" });
      requestFocus(nodeId, subtreeFitScale(nodeId, viewport));
      commit(markExplored(state, nodeId));
    },
    [requestFocus],
  );

  const openConcept = useCallback(
    (nodeId?: string) => {
      const target = nodeId ?? (view.kind !== "map" ? view.nodeId : null);
      if (!target) return;
      const node = ATLAS.byId[target];
      if (!node?.conceptId) return;
      setView({ kind: "concept", nodeId: target, conceptId: node.conceptId });
    },
    [view],
  );

  const openMarathon = useCallback(
    (nodeId?: string) => {
      const target = nodeId ?? (view.kind !== "map" ? view.nodeId : null);
      if (!target) return;
      const node = ATLAS.byId[target];
      if (!node?.conceptId) return;
      commit(startSession(state, node.conceptId));
      setView({ kind: "marathon", nodeId: target, conceptId: node.conceptId });
    },
    [view],
  );

  const completeOnboarding = useCallback((name: string, year: number) => {
    commit(setStudent(state, name, year));
  }, []);

  const answerQuestion = useCallback((input: AnswerInput) => {
    commit(recordAnswer(state, input));
  }, []);

  const rememberSignature = useCallback((problem: GeneratedProblem) => {
    commit(
      recordSignature(state, problem.conceptId, {
        familyId: problem.familyId,
        templateId: problem.templateId,
        ...(problem.context ? { context: problem.context } : {}),
        magnitude: 0,
      }),
    );
  }, []);

  const beginSession = useCallback((conceptId: string) => {
    commit(startSession(state, conceptId));
  }, []);

  const setDifficulty = useCallback((next: DifficultyId) => {
    setDifficultyState(next);
  }, []);

  const resetProgress = useCallback(() => {
    localRepository.clear();
    commit(emptyProgress());
    setView({ kind: "map" });
  }, []);

  const value = useMemo<AtlasContextValue>(
    () => ({
      ready,
      progress,
      view,
      difficulty,
      focus,
      studentName: progress.student?.name ?? "",
      studentYear: progress.student?.year ?? 8,
      xp: progress.xp,
      actions: {
        completeOnboarding,
        setDifficulty,
        openNode,
        requestFocus,
        openConcept,
        exploreChildren,
        openMarathon,
        backToMap,
        backToChooser,
        answerQuestion,
        rememberSignature,
        beginSession,
        resetProgress,
      },
    }),
    [
      ready,
      progress,
      view,
      difficulty,
      focus,
      completeOnboarding,
      setDifficulty,
      openNode,
      requestFocus,
      openConcept,
      exploreChildren,
      openMarathon,
      backToMap,
      backToChooser,
      answerQuestion,
      rememberSignature,
      beginSession,
      resetProgress,
    ],
  );

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas(): AtlasContextValue {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error("useAtlas must be used inside AtlasProvider");
  return ctx;
}

export function useMastery(conceptId: string): MasteryBreakdown {
  const { progress } = useAtlas();
  const familyCount = PROBLEM_PACKS[conceptId]?.families.length ?? 6;
  return useMemo(
    () => computeMastery(progress.concepts[conceptId], familyCount),
    [progress.concepts, conceptId, familyCount],
  );
}

export function useRecentProgress(conceptId: string) {
  const { progress } = useAtlas();
  return progress.concepts[conceptId];
}
