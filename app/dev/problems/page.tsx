"use client";

import { useMemo, useState } from "react";
import { getPack, PROBLEM_PACKS } from "@/engine/problems/registry";
import { generateFromPack, isTooSimilar } from "@/engine/problems/engine";
import { DIFFICULTIES, type DifficultyId, type GeneratedProblem } from "@/engine/problems/types";
import { uniqueNumbers } from "@/lib/validation";

interface Failure {
  seed: string;
  messages: string[];
}

interface RunSummary {
  total: number;
  ok: number;
  failures: Failure[];
  distractorsOk: number;
  duplicateAnswers: number;
  averageMs: number;
  families: Record<string, number>;
  samples: GeneratedProblem[];
}

const CHUNK = 50;

export default function DevProblemsPage() {
  const [conceptId, setConceptId] = useState("geo-pythagoras");
  const [difficulty, setDifficulty] = useState<DifficultyId>("leve");
  const [familyId, setFamilyId] = useState("");
  const [count, setCount] = useState(200);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const pack = getPack(conceptId);
  const families = useMemo(() => pack?.families ?? [], [pack]);

  const run = async () => {
    if (!pack) return;
    setRunning(true);
    const result: RunSummary = {
      total: 0,
      ok: 0,
      failures: [],
      distractorsOk: 0,
      duplicateAnswers: 0,
      averageMs: 0,
      families: {},
      samples: [],
    };
    let elapsed = 0;
    const recent: Array<{ familyId: string; templateId: string; conceptId: string; magnitude: number }> = [];

    for (let index = 0; index < count; index++) {
      const report = generateFromPack(pack, {
        difficulty,
        ...(familyId ? { familyId } : {}),
        recent,
      });
      result.total += 1;
      elapsed += report.problem?.metadata.latencyMs ?? 0;

      if (!report.problem) {
        result.failures.push({
          seed: "(sem seed)",
          messages: report.issues.slice(-4).map((issue) => `${issue.code}: ${issue.message}`),
        });
      } else {
        const problem = report.problem;
        result.ok += 1;
        result.families[problem.familyId] = (result.families[problem.familyId] ?? 0) + 1;
        if (result.samples.length < 6) result.samples.push(problem);

        const alternativeValues = problem.alternatives.map((alt) => alt.value);
        const correctOnes = problem.alternatives.filter((alt) => alt.correct).length;
        if (correctOnes !== 1) {
          result.duplicateAnswers += 1;
          result.failures.push({ seed: problem.seed, messages: [`correct alternatives: ${correctOnes}`] });
        }
        if (!uniqueNumbers(alternativeValues, 1e-3)) {
          result.duplicateAnswers += 1;
          result.failures.push({ seed: problem.seed, messages: ["duplicate alternative values"] });
        }
        if (problem.alternatives.length >= 2) result.distractorsOk += 1;
        if (isTooSimilar(
          { familyId: problem.familyId, templateId: problem.templateId, conceptId: problem.conceptId, magnitude: 0 },
          recent,
        )) {
          result.failures.push({ seed: problem.seed, messages: ["repetition filter missed a near-duplicate"] });
        }
        const numeric = Number(problem.answer.display.replace(",", "."));
        if (Number.isFinite(numeric) && !/[√]/.test(problem.answer.display)) {
          const scale = Math.max(1, Math.abs(problem.answer.value));
          if (Math.abs(numeric - problem.answer.value) > 0.02 * scale + 0.01) {
            result.failures.push({ seed: problem.seed, messages: ["answer display mismatch"] });
          }
        }
        for (const alt of problem.alternatives) {
          if (alt.correct) continue;
          const scale = Math.max(1, Math.abs(alt.value), Math.abs(problem.answer.value));
          if (Math.abs(alt.value - problem.answer.value) <= 1e-6 * scale) {
            result.failures.push({ seed: problem.seed, messages: [`distractor equals answer (${alt.id})`] });
          }
        }
        recent.unshift({
          familyId: problem.familyId,
          templateId: problem.templateId,
          conceptId: problem.conceptId,
          magnitude: 0,
        });
        recent.length = Math.min(recent.length, 6);
      }

      if (index % CHUNK === CHUNK - 1) {
        setSummary({ ...result });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    result.averageMs = Math.round((elapsed / Math.max(1, result.total)) * 100) / 100;
    setSummary(result);
    setRunning(false);
  };

  const passRate = summary ? (summary.ok / Math.max(1, summary.total)) * 100 : 0;

  return (
    <main className="min-h-screen bg-black px-8 py-10 font-body text-white">
      <p className="micro mb-3">ATLAS · FERRAMENTA INTERNA</p>
      <h1 className="font-display text-[28px] font-light tracking-[0.06em]">
        VALIDAÇÃO DE GERADORES
      </h1>
      <p className="mt-3 max-w-[720px] text-[12.5px] leading-relaxed text-white/45">
        Gera problemas em massa e reporta falhas de validação, alternativas duplicadas, respostas
        iguais aos distratores e problemas muito parecidos com os anteriores. Nada é enviado para
        fora: todo o motor é local e determinístico.
      </p>

      <section className="mt-10 flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-2">
          <span className="micro">CONCEITO</span>
          <select
            value={conceptId}
            onChange={(event) => {
              setConceptId(event.target.value);
              setFamilyId("");
            }}
            className="min-w-[220px] border border-white/20 bg-black px-3 py-2 text-[12px]"
          >
            {Object.keys(PROBLEM_PACKS).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="micro">FAMÍLIA</span>
          <select
            value={familyId}
            onChange={(event) => setFamilyId(event.target.value)}
            className="min-w-[200px] border border-white/20 bg-black px-3 py-2 text-[12px]"
          >
            <option value="">todas</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="micro">DIFICULDADE</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as DifficultyId)}
            className="border border-white/20 bg-black px-3 py-2 text-[12px]"
          >
            {DIFFICULTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="micro">AMOSTRAS</span>
          <div className="flex gap-2">
            {[100, 500, 1000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCount(value)}
                className={`border px-3 py-2 text-[11px] tracking-[0.16em] ${
                  count === value ? "border-white bg-white text-black" : "border-white/25 text-white/60"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </label>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="btn btn-solid min-w-[160px]"
        >
          {running ? "RODANDO…" : "RODAR"}
        </button>
      </section>

      {summary ? (
        <section className="mt-12 flex flex-col gap-8">
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <Metric label="GERADOS" value={`${summary.total}`} />
            <Metric label="SEM FALHAS" value={`${summary.ok}`} />
            <Metric label="TAXA" value={`${passRate.toFixed(1)}%`} />
            <Metric label="FALHAS REPORTADAS" value={`${summary.failures.length}`} />
            <Metric label="MÉDIA MS" value={`${summary.averageMs}`} />
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-2">
            {Object.entries(summary.families).map(([family, total]) => (
              <span key={family} className="text-[11px] text-white/45">
                <span className="text-white/75">{family}</span>: {total}
              </span>
            ))}
          </div>

          {summary.failures.length ? (
            <div className="flex flex-col gap-2">
              <p className="micro">FALHAS (últimas 40)</p>
              <ul className="flex flex-col gap-1 font-mono text-[11px] text-white/50">
                {summary.failures.slice(-40).map((failure, index) => (
                  <li key={index}>
                    <span className="text-white/75">{failure.seed}</span> ·{" "}
                    {failure.messages.join(" | ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[12px] text-white/60">
              Nenhuma falha detectada nesta amostra.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {summary.samples.map((problem) => (
              <article key={problem.id} className="border border-white/12 p-4">
                <div className="flex justify-between text-[10px] tracking-[0.16em] text-white/35">
                  <span>{problem.seed}</span>
                  <span>{problem.familyId}</span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-white/75">{problem.prompt}</p>
                <p className="mt-3 text-[13px] text-white">
                  resposta: <span className="tabular">{problem.answer.display}</span>
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-[11px] text-white/45">
                  {problem.alternatives.map((alternative) => (
                    <li key={alternative.id}>
                      {alternative.id} · {alternative.display}{" "}
                      {alternative.correct ? "(correta)" : `· ${alternative.misconceptionId}`}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col gap-2">
      <span className="micro">{label}</span>
      <span className="tabular font-display text-[24px] font-light text-white">{value}</span>
    </span>
  );
}
