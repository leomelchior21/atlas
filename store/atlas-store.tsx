"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ATLAS } from "@/content";
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
  | { kind: "home" }
  | { kind: "subject"; nodeId: string }
  | { kind: "node"; nodeId: string }
  | { kind: "landing"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "concept"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "marathon"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "placeholder"; nodeId: string };

interface AtlasContextValue {
  ready: boolean;
  progress: AtlasProgress;
  view: AtlasView;
  difficulty: DifficultyId;
  studentName: string;
  studentYear: number;
  xp: number;
  actions: {
    completeOnboarding: (name: string, year: number) => void;
    setDifficulty: (difficulty: DifficultyId) => void;
    goHome: () => void;
    /** routes by node type: concept → landing, branches → grid, else placeholder */
    openNode: (nodeId: string) => void;
    /** always the subject overview (carousel + territories) */
    openSubject: (nodeId: string) => void;
    /** the "explore branches" door of a concept landing */
    openBranches: (nodeId: string) => void;
    openParent: (nodeId: string) => void;
    openConcept: (nodeId?: string) => void;
    openMarathon: (nodeId?: string) => void;
    backToLanding: () => void;
    answerQuestion: (input: AnswerInput) => void;
    rememberSignature: (problem: GeneratedProblem) => void;
    beginSession: (conceptId: string) => void;
    resetProgress: () => void;
  };
}

const AtlasContext = createContext<AtlasContextValue | null>(null);

/* ------------------------------------------------------ progress store */

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

export function hasChildren(nodeId: string): boolean {
  return (ATLAS.childrenOf[nodeId] ?? []).length > 0;
}

export function childrenOf(nodeId: string): AtlasNode[] {
  return ATLAS.childrenOf[nodeId] ?? [];
}

/** the subject root that contains a node (itself, when it is one) */
export function subjectRootOf(nodeId: string | null | undefined): AtlasNode | undefined {
  if (!nodeId) return ATLAS.subjects[0];
  let current = ATLAS.byId[nodeId];
  while (current?.parentId) {
    current = ATLAS.byId[current.parentId];
  }
  return current;
}

function viewFor(node: AtlasNode): AtlasView {
  if (node.hasConcept && node.conceptId) {
    return { kind: "landing", nodeId: node.id, conceptId: node.conceptId };
  }
  if ((ATLAS.childrenOf[node.id] ?? []).length > 0) {
    return { kind: "node", nodeId: node.id };
  }
  return { kind: "placeholder", nodeId: node.id };
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<AtlasView>({ kind: "home" });
  const [difficulty, setDifficultyState] = useState<DifficultyId>("normal");

  useEffect(() => {
    hydrate();
    const handle = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(handle);
  }, []);

  const goHome = useCallback(() => setView({ kind: "home" }), []);

  const openNode = useCallback((nodeId: string) => {
    const node = ATLAS.byId[nodeId];
    if (!node) return;
    commit(markExplored(state, nodeId, node.conceptId));
    if (node.depth === 0) {
      setView({ kind: "subject", nodeId });
      return;
    }
    setView(viewFor(node));
  }, []);

  const openSubject = useCallback((nodeId: string) => {
    const subject = subjectRootOf(nodeId);
    if (!subject) return;
    commit(markExplored(state, subject.id, subject.conceptId));
    setView({ kind: "subject", nodeId: subject.id });
  }, []);

  const openBranches = useCallback((nodeId: string) => {
    const node = ATLAS.byId[nodeId];
    if (!node) return;
    setView({ kind: "node", nodeId });
  }, []);

  const openParent = useCallback(
    (nodeId: string) => {
      const node = ATLAS.byId[nodeId];
      if (!node?.parentId) {
        goHome();
        return;
      }
      const parent = ATLAS.byId[node.parentId];
      if (!parent) {
        goHome();
        return;
      }
      if (parent.depth === 0) {
        setView({ kind: "subject", nodeId: parent.id });
        return;
      }
      setView(viewFor(parent));
    },
    [goHome],
  );

  const openConcept = useCallback(
    (nodeId?: string) => {
      const target = nodeId ?? (view.kind !== "home" ? view.nodeId : undefined);
      const node = target ? ATLAS.byId[target] : undefined;
      if (!node?.conceptId) return;
      setView({ kind: "concept", nodeId: node.id, conceptId: node.conceptId });
    },
    [view],
  );

  const openMarathon = useCallback(
    (nodeId?: string) => {
      const target = nodeId ?? (view.kind !== "home" ? view.nodeId : undefined);
      const node = target ? ATLAS.byId[target] : undefined;
      if (!node?.conceptId) return;
      commit(startSession(state, node.conceptId));
      setView({ kind: "marathon", nodeId: node.id, conceptId: node.conceptId });
    },
    [view],
  );

  const backToLanding = useCallback(() => {
    if (view.kind === "home") return;
    const node = ATLAS.byId[view.nodeId];
    if (!node?.conceptId) {
      openParent(view.nodeId);
      return;
    }
    setView({ kind: "landing", nodeId: node.id, conceptId: node.conceptId });
  }, [view, openParent]);

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
    setView({ kind: "home" });
  }, []);

  const value = useMemo<AtlasContextValue>(
    () => ({
      ready,
      progress,
      view,
      difficulty,
      studentName: progress.student?.name ?? "",
      studentYear: progress.student?.year ?? 8,
      xp: progress.xp,
      actions: {
        completeOnboarding,
        setDifficulty,
        goHome,
        openNode,
        openSubject,
        openBranches,
        openParent,
        openConcept,
        openMarathon,
        backToLanding,
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
      completeOnboarding,
      setDifficulty,
      goHome,
      openNode,
      openSubject,
      openBranches,
      openParent,
      openConcept,
      openMarathon,
      backToLanding,
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
