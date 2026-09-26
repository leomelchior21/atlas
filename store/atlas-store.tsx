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
import { ATLAS } from "@/content";
import { ancestorsToExpand, ATLAS_ROOT_ID } from "@/lib/atlas/tree";
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
  | { kind: "landing"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "concept"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "marathon"; nodeId: string; conceptId: FunctionalConceptId }
  | { kind: "placeholder"; nodeId: string };

export interface FocusRequest {
  nodeId: string;
  nonce: number;
}

interface AtlasContextValue {
  ready: boolean;
  progress: AtlasProgress;
  view: AtlasView;
  difficulty: DifficultyId;
  focus: FocusRequest | null;
  selectedId: string | null;
  expanded: string[];
  studentName: string;
  studentYear: number;
  xp: number;
  actions: {
    completeOnboarding: (name: string, year: number) => void;
    setDifficulty: (difficulty: DifficultyId) => void;
    selectNode: (nodeId: string) => void;
    toggleExpanded: (nodeId: string) => void;
    setExpanded: (ids: string[]) => void;
    expandTo: (nodeId: string) => void;
    clearSelection: () => void;
    openNode: (nodeId: string) => void;
    openConcept: (nodeId?: string) => void;
    openMarathon: (nodeId?: string) => void;
    backToMap: () => void;
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

export function isFunctional(nodeId: string): boolean {
  const node = ATLAS.byId[nodeId];
  return Boolean(node?.hasConcept && node.conceptId);
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<AtlasView>({ kind: "map" });
  const [difficulty, setDifficultyState] = useState<DifficultyId>("normal");
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([ATLAS_ROOT_ID]);
  const nonce = useRef(0);

  useEffect(() => {
    hydrate();
    const handle = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(handle);
  }, []);

  const requestFocus = useCallback((nodeId: string) => {
    nonce.current += 1;
    setFocus({ nodeId, nonce: nonce.current });
  }, []);

  /** tapping a node inspects it: the panel follows, the tree keeps its place */
  const selectNode = useCallback(
    (nodeId: string) => {
      if (!ATLAS.byId[nodeId]) return;
      setSelectedId(nodeId);
      setView({ kind: "map" });
      commit(markExplored(state, nodeId, ATLAS.byId[nodeId]?.conceptId));
    },
    [],
  );

  const clearSelection = useCallback(() => setSelectedId(null), []);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpanded((current) =>
      current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId],
    );
  }, []);

  const setExpandedTo = useCallback((ids: string[]) => {
    setExpanded(ids.includes(ATLAS_ROOT_ID) ? ids : [ATLAS_ROOT_ID, ...ids]);
  }, []);

  /** makes a node visible wherever it is: opens every ancestor and frames it */
  const expandTo = useCallback(
    (nodeId: string) => {
      const chain = ancestorsToExpand(nodeId);
      setExpanded((current) => [...new Set([...current, ...chain])]);
      setSelectedId(nodeId);
      setView({ kind: "map" });
      requestFocus(nodeId);
      commit(markExplored(state, nodeId, ATLAS.byId[nodeId]?.conceptId));
    },
    [requestFocus],
  );

  /** the explicit action button inside the panel */
  const openNode = useCallback(
    (nodeId: string) => {
      const node = ATLAS.byId[nodeId];
      if (!node) return;
      setSelectedId(nodeId);
      if (node.hasConcept && node.conceptId) {
        setView({ kind: "landing", nodeId, conceptId: node.conceptId });
        return;
      }
      setView({ kind: "placeholder", nodeId });
    },
    [],
  );

  const openConcept = useCallback(
    (nodeId?: string) => {
      const target = nodeId ?? selectedId;
      const node = target ? ATLAS.byId[target] : undefined;
      if (!node?.conceptId) return;
      setView({ kind: "concept", nodeId: node.id, conceptId: node.conceptId });
    },
    [selectedId],
  );

  const openMarathon = useCallback(
    (nodeId?: string) => {
      const target = nodeId ?? selectedId;
      const node = target ? ATLAS.byId[target] : undefined;
      if (!node?.conceptId) return;
      commit(startSession(state, node.conceptId));
      setView({ kind: "marathon", nodeId: node.id, conceptId: node.conceptId });
    },
    [selectedId],
  );

  const backToMap = useCallback(() => {
    setView({ kind: "map" });
    const target = selectedId ?? focus?.nodeId;
    if (target) requestFocus(target);
  }, [requestFocus, selectedId, focus]);

  const backToLanding = useCallback(() => {
    const node = selectedId ? ATLAS.byId[selectedId] : undefined;
    if (!node?.conceptId) {
      setView({ kind: "map" });
      return;
    }
    setView({ kind: "landing", nodeId: node.id, conceptId: node.conceptId });
  }, [selectedId]);

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
    setSelectedId(null);
    setExpanded([ATLAS_ROOT_ID]);
  }, []);

  const value = useMemo<AtlasContextValue>(
    () => ({
      ready,
      progress,
      view,
      difficulty,
      focus,
      selectedId,
      expanded,
      studentName: progress.student?.name ?? "",
      studentYear: progress.student?.year ?? 8,
      xp: progress.xp,
      actions: {
        completeOnboarding,
        setDifficulty,
        selectNode,
        toggleExpanded,
        setExpanded: setExpandedTo,
        expandTo,
        clearSelection,
        openNode,
        openConcept,
        openMarathon,
        backToMap,
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
      focus,
      selectedId,
      expanded,
      completeOnboarding,
      setDifficulty,
      selectNode,
      toggleExpanded,
      setExpandedTo,
      expandTo,
      clearSelection,
      openNode,
      openConcept,
      openMarathon,
      backToMap,
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
