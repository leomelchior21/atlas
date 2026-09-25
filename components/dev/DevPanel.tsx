"use client";

import { useEffect, useState } from "react";
import { ProblemDiagram } from "@/components/geometry/ProblemDiagram";
import { getPack, PROBLEM_PACKS } from "@/engine/problems/registry";
import { generateFromPack } from "@/engine/problems/engine";
import {
  DIFFICULTIES,
  type DifficultyId,
  type GeneratedProblem,
} from "@/engine/problems/types";

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [conceptId, setConceptId] = useState("geo-pythagoras");
  const [difficulty, setDifficulty] = useState<DifficultyId>("normal");
  const [familyId, setFamilyId] = useState("");
  const [seed, setSeed] = useState("");
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (overrideSeed?: string) => {
    const pack = getPack(conceptId);
    if (!pack) return;
    const effectiveSeed = overrideSeed ?? seed;
    const report = generateFromPack(pack, {
      difficulty,
      ...(familyId ? { familyId } : {}),
      ...(effectiveSeed.trim() ? { seed: effectiveSeed.trim() } : {}),
    });
    setProblem(report.problem);
    setIssues(report.issues.slice(-8).map((i) => `${i.severity}: ${i.code} — ${i.message}`));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-50 rounded-full border border-white/25 bg-black/80 px-3 py-1 text-[9px] tracking-[0.2em] text-white/50"
      >
        DEV
      </button>
    );
  }

  const pack = getPack(conceptId);

  return (
    <div className="fixed bottom-3 right-3 z-50 flex max-h-[86vh] w-[380px] flex-col overflow-hidden rounded-[12px] border border-white/15 bg-black/95 text-[11px]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="tracking-[0.24em] text-white/60">DEV · PROBLEM ENGINE</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-white/40 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto scroll-thin px-4 py-3">
        <label className="flex flex-col gap-1">
          <span className="micro">CONCEITO</span>
          <select
            value={conceptId}
            onChange={(event) => {
              setConceptId(event.target.value);
              setFamilyId("");
            }}
            className="border border-white/15 bg-black px-2 py-1"
          >
            {Object.keys(PROBLEM_PACKS).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="micro">FAMÍLIA</span>
          <select
            value={familyId}
            onChange={(event) => setFamilyId(event.target.value)}
            className="border border-white/15 bg-black px-2 py-1"
          >
            <option value="">(aleatória)</option>
            {pack?.families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.id}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          {DIFFICULTIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDifficulty(item)}
              className={`flex-1 border px-2 py-1 tracking-[0.16em] ${
                difficulty === item ? "border-white bg-white text-black" : "border-white/20 text-white/60"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1">
          <span className="micro">SEED</span>
          <input
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            placeholder="GEO-PYT-XXXXX"
            className="border border-white/15 bg-black px-2 py-1 font-mono"
          />
        </label>

        <div className="flex gap-2">
          <button type="button" onClick={() => run()} className="flex-1 border border-white/40 py-1 tracking-[0.18em] hover:bg-white/10">
            GERAR
          </button>
          <button
            type="button"
            onClick={() => {
              setSeed("");
              run("");
            }}
            className="flex-1 border border-white/20 py-1 tracking-[0.18em] hover:bg-white/10"
          >
            NOVA SEED
          </button>
        </div>

        {issues.length ? (
          <ul className="flex flex-col gap-1 border border-white/10 p-2 text-[10px] text-white/45">
            {issues.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        ) : null}

        {problem ? (
          <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
            <div className="flex justify-between text-white/40">
              <span>{problem.seed}</span>
              <span>{problem.familyId}</span>
            </div>
            <p className="text-white/75">{problem.prompt}</p>
            <div className="h-[150px] border border-white/10">
              <ProblemDiagram spec={problem.diagram} />
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">RESPOSTA</span>
              <span className="tabular text-white">{problem.answer.display}</span>
            </div>
            <div className="flex flex-col gap-1">
              {problem.alternatives.map((alternative) => (
                <div
                  key={alternative.id}
                  className={`flex justify-between ${
                    alternative.correct ? "text-white" : "text-white/45"
                  }`}
                >
                  <span>
                    {alternative.id} {alternative.display}
                  </span>
                  <span className="text-[10px] text-white/35">
                    {alternative.misconceptionId ?? "correta"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 border-t border-white/10 pt-2 text-[10px] text-white/40">
              {Object.entries(problem.variables).map(([key, value]) => (
                <span key={key}>
                  {key} = {String(value)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
