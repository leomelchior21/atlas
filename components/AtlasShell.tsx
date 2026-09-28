"use client";

import { useState } from "react";
import { AtlasMark } from "@/components/atlas/AtlasLogo";
import { ConceptLanding } from "@/components/atlas/ConceptLanding";
import { HomeView } from "@/components/atlas/HomeView";
import { NodeView } from "@/components/atlas/NodeView";
import { SubjectView } from "@/components/atlas/SubjectView";
import { TopBar } from "@/components/atlas/TopBar";
import { ConceptView } from "@/components/concept/ConceptView";
import { PlaceholderView } from "@/components/concept/PlaceholderView";
import { DevPanel } from "@/components/dev/DevPanel";
import { MarathonView } from "@/components/marathon/MarathonView";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { useAtlas } from "@/store/atlas-store";

export function AtlasShell() {
  const { ready, view, actions } = useAtlas();
  const [entering, setEntering] = useState(false);

  if (!ready) return <BootScreen />;

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <TopBar onEnter={() => setEntering(true)} />

      <div className="relative min-h-0 flex-1">
        {view.kind === "home" ? <HomeView /> : null}
        {view.kind === "subject" ? <SubjectView nodeId={view.nodeId} /> : null}
        {view.kind === "node" ? <NodeView nodeId={view.nodeId} /> : null}
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
            <PlaceholderView nodeId={view.nodeId} onBack={() => actions.openParent(view.nodeId)} />
          </div>
        ) : null}
      </div>

      {entering ? (
        <div className="absolute inset-0 z-50 bg-black">
          <Onboarding
            onComplete={(name, year) => {
              actions.completeOnboarding(name, year);
              setEntering(false);
            }}
          />
        </div>
      ) : null}

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
