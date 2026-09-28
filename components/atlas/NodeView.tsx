"use client";

import { ATLAS, ancestorsOf } from "@/content";
import { useAtlas, childrenOf } from "@/store/atlas-store";
import { ExploreHint, ProgressCard, TopicCard } from "./cards";
import { NodeEmblem } from "./NodeEmblem";
import { NodeIcon } from "./NodeIcon";

function childNoun(depth: number): string {
  if (depth <= 1) return "territórios";
  if (depth === 2) return "conceitos";
  return "temas";
}

export function NodeView({ nodeId }: { nodeId: string }) {
  const { actions, progress } = useAtlas();
  const node = ATLAS.byId[nodeId];
  if (!node) return null;

  const children = childrenOf(node.id);
  const explored = children.filter((child) => progress.explored.includes(child.id)).length;
  const parent = node.parentId ? ATLAS.byId[node.parentId] : undefined;
  const ancestors = ancestorsOf(node.id);
  const caption = node.motto ?? node.blurb;

  return (
    <div className="viewport-fit flex h-full flex-col lg:flex-row">
      {/* sidebar */}
      <aside className="hidden shrink-0 flex-col border-r border-white/8 px-6 py-7 lg:flex lg:w-[268px]">
        <button
          type="button"
          onClick={() => actions.openParent(node.id)}
          className="group flex w-fit items-center gap-3 text-[10px] tracking-[0.26em] text-white/50 transition-colors hover:text-white"
        >
          <span aria-hidden="true" className="text-[12px]">
            ←
          </span>
          {parent ? `Voltar para ${parent.shortTitle}` : "Voltar ao Atlas"}
        </button>

        <p className="micro mt-7">
          {ancestors.map((ancestor) => (
            <span key={ancestor.id}>
              {ancestor.shortTitle}
              <span className="px-1.5 text-white/25" aria-hidden="true">
                ›
              </span>
            </span>
          ))}
        </p>

        <h1 className="mt-3 font-display text-[19px] font-light uppercase tracking-[0.14em] text-white">
          {node.title}
        </h1>
        <p className="mt-3 text-[12px] leading-relaxed text-white/45">
          Selecione um {childNoun(node.depth).replace(/s$/, "")} para explorar.
        </p>

        <div className="mt-6">
          <ProgressCard
            explored={explored}
            total={children.length}
            label={childNoun(node.depth)}
          />
        </div>

        {caption ? (
          <div className="mt-auto pt-8">
            <NodeEmblem id={node.id} className="h-44 w-44 opacity-80" />
            <p className="mt-5 text-[10px] uppercase leading-[1.9] tracking-[0.22em] text-white/30">
              {caption}
            </p>
          </div>
        ) : null}
      </aside>

      {/* main */}
      <main className="scroll-thin min-h-0 flex-1 px-4 pb-4 pt-5 sm:px-6 lg:px-10 lg:py-7">
        <button
          type="button"
          onClick={() => actions.openParent(node.id)}
          className="group mb-5 flex items-center gap-3 text-[10px] tracking-[0.26em] text-white/50 transition-colors hover:text-white lg:hidden"
        >
          <span aria-hidden="true" className="text-[12px]">
            ←
          </span>
          {parent ? `Voltar para ${parent.shortTitle}` : "Voltar ao Atlas"}
        </button>

        <header className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border border-white/18 text-white/85">
            <NodeIcon id={node.id} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="t-title truncate text-white">{node.title}</h2>
            {node.motto ? (
              <p className="mt-2 text-[9.5px] tracking-[0.3em] text-white/40">{node.motto}</p>
            ) : null}
          </div>
        </header>

        <div className="mt-5 lg:hidden">
          <ProgressCard
            explored={explored}
            total={children.length}
            label={childNoun(node.depth)}
          />
        </div>

        <div className="mt-6 grid content-start gap-3 sm:grid-cols-2 lg:mt-8">
          {children.map((child) => (
            <TopicCard
              key={child.id}
              node={child}
              onOpen={() => actions.openNode(child.id)}
            />
          ))}
        </div>

        <ExploreHint>
          TOQUE EM UM {childNoun(node.depth).replace(/s$/, "").toUpperCase()} PARA EXPLORAR
        </ExploreHint>
      </main>
    </div>
  );
}
