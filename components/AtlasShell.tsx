"use client";

import { useMemo } from "react";
import { ATLAS } from "@/content";
import { AtlasMap } from "@/components/atlas/AtlasMap";
import { AtlasMark } from "@/components/atlas/AtlasLogo";
import { ConceptLanding } from "@/components/atlas/ConceptLanding";
import { ConnectionsPanel, TopBar } from "@/components/atlas/TopBar";
import { ConceptView } from "@/components/concept/ConceptView";
import { PlaceholderView } from "@/components/concept/PlaceholderView";
import { DevPanel } from "@/components/dev/DevPanel";
import { MarathonView } from "@/components/marathon/MarathonView";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { useAtlas } from "@/store/atlas-store";
import { useState } from "react";

export function AtlasShell() {
  const { ready, progress, view, actions, focus, studentYear, selectedId } = useAtlas();
  const [connectionsOpen, setConnectionsOpen] = useState(false);

  const masteryByNode = useMemo(() => {
    const map: Record<string, number> = {};
    for (const node of ATLAS.nodes) {
      if (!node.conceptId) continue;
      const record = progress.concepts[node.conceptId];
      if (!record) continue;
      map[node.id] = masteryOf(record);
    }
    return map;
  }, [progress.concepts]);

  if (!ready) return <BootScreen />;

  if (!progress.student) {
    return <Onboarding onComplete={actions.completeOnboarding} />;
  }

  const immersive = view.kind === "concept" || view.kind === "marathon";

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <TopBar
        compact={immersive}
        connectionsOpen={connectionsOpen}
        onToggleConnections={() => setConnectionsOpen((value) => !value)}
      />

      <div className="relative min-h-0 flex-1">
        <AtlasMap
          focus={focus}
          studentYear={studentYear}
          masteryByNode={masteryByNode}
          explored={progress.explored}
          selectedId={selectedId}
          onSelect={(nodeId) => {
            setConnectionsOpen(false);
            actions.selectNode(nodeId);
          }}
          onClearSelection={actions.clearSelection}
          onOpen={actions.openNode}
        />

        {view.kind === "landing" ? <ConceptLanding nodeId={view.nodeId} /> : null}

        {view.kind === "concept" ? (
          <div className="absolute inset-0 z-30 bg-black fade-in">
            <ConceptView conceptId={view.conceptId} onLeave={actions.backToLanding} />
          </div>
        ) : null}

        {view.kind === "marathon" ? (
          <div className="absolute inset-0 z-30 bg-black fade-in">
            <MarathonView onExit={actions.backToLanding} />
          </div>
        ) : null}

        {view.kind === "placeholder" ? (
          <div className="absolute inset-0 z-30 bg-black fade-in">
            <PlaceholderView nodeId={view.nodeId} onBack={actions.backToMap} />
          </div>
        ) : null}

        {connectionsOpen ? (
          <ConnectionsPanel
            nodeId={selectedId ?? focus?.nodeId ?? null}
            onClose={() => setConnectionsOpen(false)}
          />
        ) : null}
      </div>

      {process.env.NODE_ENV !== "production" ? <DevPanel /> : null}
    </div>
  );
}

function BootScreen() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black">
      <AtlasMark size={64} className="mb-6 opacity-80" />
      <span
        className="font-display text-white/70"
        style={{ fontSize: 13, letterSpacing: "0.7em", paddingLeft: "0.7em" }}
      >
        ATLAS
      </span>
      <span className="relative mt-8 block h-px w-[120px] overflow-hidden bg-white/10">
        <span
          className="absolute inset-y-0 w-1/2 bg-white/60"
          style={{ animation: "atlas-sweep 1.4s ease-in-out infinite" }}
        />
      </span>
    </div>
  );
}

const DIFFICULTY_WEIGHT: Record<string, number> = { leve: 1, normal: 1.6, avancada: 2.6 };
const EXPOSURE_TARGET = 4;

function masteryOf(record: {
  byDifficulty: Record<
    string,
    { attempts: number; correct: number; families: Record<string, { correct: number }> }
  >;
  recent: unknown[];
  streak: number;
}): number {
  let weighted = 0;
  let total = 0;
  const families = new Set<string>();
  let attempts = 0;
  for (const [difficulty, bucket] of Object.entries(record.byDifficulty)) {
    const weight = DIFFICULTY_WEIGHT[difficulty] ?? 1;
    const exposure = Math.min(1, bucket.attempts / EXPOSURE_TARGET);
    const accuracy = bucket.attempts > 0 ? bucket.correct / bucket.attempts : 0;
    weighted += weight * exposure * accuracy;
    total += weight;
    attempts += bucket.attempts;
    for (const [familyId, family] of Object.entries(bucket.families)) {
      if (family.correct > 0) families.add(familyId);
    }
  }
  const depth = total > 0 ? weighted / total : 0;
  const diversity = Math.min(1, families.size / 6);
  const recentForm = record.recent.length >= 4 ? 1 : 0.5;
  const overall = 100 * depth * (0.55 + 0.3 * diversity + 0.15 * recentForm);
  return attempts === 0 ? 0 : Math.min(100, overall);
}
