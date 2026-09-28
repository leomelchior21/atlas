"use client";

import { ATLAS } from "@/content";
import { useAtlas, childrenOf } from "@/store/atlas-store";
import { AtlasMark } from "./AtlasLogo";
import { ExploreHint, TopicCard } from "./cards";
import { NodeIcon } from "./NodeIcon";

export function SubjectView({ nodeId }: { nodeId: string }) {
  const { actions } = useAtlas();
  const subject = ATLAS.byId[nodeId] ?? ATLAS.subjects[0];
  const territories = childrenOf(subject.id);

  return (
    <div className="viewport-fit flex h-full flex-col">
      <header className="shrink-0 pt-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <AtlasMark size={26} />
          <span
            className="font-display font-light text-white"
            style={{ fontSize: 15, letterSpacing: "0.56em", paddingLeft: "0.2em" }}
          >
            ATLAS
          </span>
        </div>
        <p className="mt-3 text-[9.5px] tracking-[0.42em] text-white/40">
          CONHECIMENTO EM ÓRBITA
        </p>
      </header>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-6 px-4 pb-2 pt-6 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-10">
        {/* subject carousel */}
        <div className="scroll-thin -mx-4 flex shrink-0 snap-x snap-mandatory items-center gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
          {ATLAS.subjects.map((entry) => {
            const active = entry.id === subject.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => actions.openSubject(entry.id)}
                aria-current={active ? "true" : undefined}
                className={`group relative flex shrink-0 snap-center flex-col items-center justify-center gap-4 rounded-[20px] border transition-all duration-300 ${
                  active
                    ? "h-[200px] w-[150px] border-white/70 bg-white/[0.02] shadow-[0_0_60px_-18px_rgba(255,255,255,0.55)] lg:h-[280px] lg:w-[190px]"
                    : "h-[160px] w-[112px] border-white/14 opacity-55 hover:opacity-90 lg:h-[230px] lg:w-[140px]"
                }`}
              >
                <span
                  className={`transition-colors ${
                    active ? "text-white" : "text-white/70 group-hover:text-white"
                  }`}
                >
                  <NodeIcon id={entry.id} className={active ? "h-12 w-12" : "h-8 w-8"} />
                </span>
                <span
                  className={`font-display font-light tracking-[0.3em] ${
                    active ? "text-[12px] text-white" : "text-[10px] text-white/60"
                  }`}
                >
                  {entry.title}
                </span>
                {active ? (
                  <span className="absolute bottom-6 h-px w-6 bg-white/60" aria-hidden="true" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-5 text-[12px] text-white/35 transition-colors group-hover:text-white/80"
                  >
                    →
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* territories */}
        <div className="min-h-0 flex-1 lg:overflow-y-auto lg:pr-1">
          <p className="micro mb-4 hidden lg:block">{subject.title} · TERRITÓRIOS</p>
          <div className="grid content-start gap-3 sm:grid-cols-2">
            {territories.map((territory) => (
              <TopicCard
                key={territory.id}
                node={territory}
                onOpen={() => actions.openNode(territory.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <ExploreHint>TOQUE EM UM TÓPICO OU APROXIME PARA EXPLORAR</ExploreHint>
    </div>
  );
}
