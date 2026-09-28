"use client";

import { ATLAS } from "@/content";
import { useAtlas } from "@/store/atlas-store";
import { ExploreHint } from "./cards";

export function HomeView() {
  const { actions } = useAtlas();

  return (
    <div className="viewport-fit flex h-full flex-col items-center justify-center gap-8 px-4 py-8 sm:gap-12 sm:px-8">
      <div className="grid w-full max-w-[1000px] grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
        {ATLAS.subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => actions.openSubject(subject.id)}
            className="group relative flex h-[104px] items-center justify-center overflow-hidden rounded-[18px] border border-white/28 transition-all duration-300 hover:border-white/70 hover:bg-white/[0.02] sm:h-[290px] lg:h-[330px]"
          >
            <span className="font-display text-[15px] font-light tracking-[0.42em] text-white/85 transition-colors group-hover:text-white sm:text-[17px] sm:tracking-[0.5em] lg:text-[19px]">
              {subject.title}
            </span>
          </button>
        ))}
      </div>

      <ExploreHint>TOQUE OU APROXIME PARA EXPLORAR</ExploreHint>
    </div>
  );
}
