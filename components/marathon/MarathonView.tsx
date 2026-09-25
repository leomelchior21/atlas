"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nodeById } from "@/content";
import { ProblemDiagram } from "@/components/geometry/ProblemDiagram";
import { computeMastery, masteryLabel } from "@/engine/mastery";
import { generateProblem } from "@/engine/problems/registry";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  type DifficultyId,
  type GeneratedProblem,
} from "@/engine/problems/types";
import { useAtlas } from "@/store/atlas-store";

const FAMILY_HINTS: Record<string, string> = {
  "find-hypotenuse": "A hipotenusa é o maior lado e fica oposta ao ângulo reto. Use c² = a² + b².",
  "find-leg": "Para achar um cateto, isole-o: x² = c² − a².",
  triples: "Reconheça ternos conhecidos: 3-4-5, 5-12-13, 8-15-17, 7-24-25.",
  decimals: "Trabalhe com os quadrados e só extraia a raiz no final.",
  diagram: "Identifique primeiro quem é a hipotenusa na figura: ela é oposta ao ângulo reto.",
  context: "Desenhe o triângulo retângulo escondido no enunciado e marque o que é conhecido.",
  "right-or-not": "Compare o quadrado do maior lado com a soma dos quadrados dos outros dois.",
  "multi-step": "Antes de aplicar o teorema, encontre a medida que falta usando o dado extra.",
  classify: "Compare o valor com 90° e com 180° para escolher a classe.",
  complement: "Complementares somam 90°: faça 90° − x.",
  supplement: "Suplementares somam 180°: faça 180° − x.",
  adjacent: "Os dois ângulos estão sobre a mesma reta, então somam 180°.",
  bisector: "A bissetriz divide o ângulo em duas partes iguais. Divida e depois continue.",
  rectangle: "Área é b × h. Perímetro é 2 × (b + h). Verifique qual o problema pede.",
  triangle: "O triângulo é metade de um retângulo de mesma base e altura.",
  parallelogram: "Use a altura perpendicular à base, não o lado inclinado.",
  trapezoid: "Some as duas bases, multiplique pela altura e divida por 2.",
  "missing-dimension": "Reorganize a fórmula para isolar a medida que falta.",
  composite: "Separe a figura em partes, calcule cada uma e combine.",
  square: "Quatro lados iguais: P = 4 × lado.",
  polygon: "Some cada lado exatamente uma vez.",
  "missing-side": "Subtraia do perímetro a soma dos lados conhecidos.",
  "classify-sides": "Conte quantos lados são iguais entre si.",
  "angle-sum": "A soma dos três ângulos internos é 180°.",
  "classify-angles": "Compare o maior ângulo com 90°.",
  isosceles: "Os dois ângulos da base são iguais. Divida o que sobra por 2.",
  exterior: "O ângulo externo é a soma dos dois internos não adjacentes.",
  inequality: "A soma dos dois menores lados precisa ser maior que o maior lado.",
  ratio: "Some as partes da razão e divida 180° por esse total.",
};

export function MarathonView({ onExit }: { onExit: () => void }) {
  const { view, difficulty, actions, progress } = useAtlas();
  const conceptId = view.kind === "marathon" ? view.conceptId : "";
  const nodeId = view.kind === "marathon" ? view.nodeId : "";
  const node = nodeById(nodeId);
  const concept = node?.conceptId === conceptId ? node : nodeById(conceptId);
  const record = progress.concepts[conceptId];

  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const lastSeed = useRef<string | null>(null);
  const nextRef = useRef<() => void>(() => {});

  const mastery = useMemo(() => computeMastery(record, 8), [record]);

  const next = useCallback(() => {
    if (!conceptId) return;
    const recent = record?.recent ?? [];
    let candidate: GeneratedProblem | null = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      candidate = generateProblem({ conceptId, difficulty, recent });
      if (!candidate) break;
      if (candidate.seed !== lastSeed.current) break;
    }
    if (!candidate) {
      setFailure("Não foi possível gerar uma questão válida com os filtros atuais.");
      setProblem(null);
      return;
    }
    lastSeed.current = candidate.seed;
    actions.rememberSignature(candidate);
    setProblem(candidate);
    setSelected(null);
    setShowHint(false);
    setRevealed(false);
    setFailure(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId, difficulty]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  useEffect(() => {
    setCount(1);
    nextRef.current();
  }, [conceptId, difficulty]);

  const answered = selected !== null;
  const chosen = problem?.alternatives.find((alt) => alt.id === selected) ?? null;
  const misconception = chosen?.misconceptionId
    ? problem?.misconceptions.find((item) => item.id === chosen.misconceptionId)
    : undefined;

  const handleSelect = (id: string) => {
    if (!problem || answered) return;
    const alternative = problem.alternatives.find((alt) => alt.id === id);
    if (!alternative) return;
    setSelected(id);
    actions.answerQuestion({
      problem,
      correct: alternative.correct,
      ...(alternative.misconceptionId ? { misconceptionId: alternative.misconceptionId } : {}),
    });
  };

  const advanced = difficulty === "avancada";
  const alternativesVisible = !advanced || revealed;
  const needsDiagram =
    !advanced ||
    /ao lado|figura|diagrama|recorte|ret[âa]ngulo de|tri[âa]ngulo ao|a figura/i.test(
      problem?.prompt ?? "",
    );
  const showDiagram = Boolean(problem) && needsDiagram && problem?.diagram.kind !== "none";

  return (
    <div className="viewport-fit flex flex-col bg-black px-7 pb-5 pt-4">
      {/* status strip */}
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-3 text-[11px] tracking-[0.26em] text-white/55 transition-colors hover:text-white"
          >
            <span aria-hidden="true" className="text-[14px] leading-none">
              ←
            </span>
            MARATONA
          </button>
          <span className="tabular text-[11px] tracking-[0.18em] text-white/40">{count} / ∞</span>
          <span className="relative hidden h-px w-[160px] bg-white/12 sm:block lg:w-[240px]">
            <span
              className="absolute inset-y-0 left-0 bg-white/60"
              style={{ width: `${Math.min(100, 10 + (count - 1) * 6)}%` }}
            />
          </span>
        </div>

        <div className="flex items-center gap-2">
          {DIFFICULTIES.map((item) => {
            const active = difficulty === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => actions.setDifficulty(item as DifficultyId)}
                aria-pressed={active}
                className={`min-h-[38px] rounded-full border px-5 text-[11px] tracking-[0.2em] transition-colors ${
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/28 text-white/65 hover:border-white/60 hover:text-white"
                }`}
              >
                {DIFFICULTY_LABELS[item]}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-white/10 pb-3">
        <p className="micro">
          {concept?.title ?? ""} <span className="text-white/25">·</span>{" "}
          {problem?.familyTitle ?? ""}
        </p>
        <div className="flex items-center gap-7">
          <HudStat label="XP" value={String(progress.xp)} />
          <HudStat label="DOMÍNIO" value={`${Math.round(mastery.overall)}%`} />
          <HudStat label="SEQUÊNCIA" value={String(record?.streak ?? 0)} />
          <span className="hidden text-[10px] tracking-[0.2em] text-white/35 xl:inline">
            {masteryLabel(mastery.overall)}
          </span>
        </div>
      </div>

      {/* hero: question + diagram */}
      <div className="flex min-h-0 flex-1 gap-10 pt-8">
        <div className="flex min-w-0 flex-[7] flex-col">
          <h1 className="t-question max-w-[700px] text-white">
            {problem?.prompt ?? (failure ?? "Gerando questão…")}
          </h1>

          {problem?.formula ? (
            <p className="mt-6 font-display text-[15px] tracking-[0.04em] text-white/55">
              {problem.formula}
            </p>
          ) : null}

          {showDiagram && advanced ? (
            <div className="mt-6 min-h-[200px] flex-1 lg:hidden">
              <ProblemDiagram spec={problem!.diagram} />
            </div>
          ) : null}

          {showHint ? (
            <div className="rise-in mt-7 max-w-[560px] border-l border-white/25 pl-4">
              <p className="micro mb-2">DICA</p>
              <p className="text-[13px] leading-relaxed text-white/60">
                {FAMILY_HINTS[problem?.familyId ?? ""] ??
                  "Releia o enunciado e identifique as grandezas conhecidas antes de calcular."}
              </p>
            </div>
          ) : null}
        </div>

        <div className="hidden min-h-0 flex-[5] items-center justify-center lg:flex">
          {showDiagram && problem ? (
            <div className="h-full w-full max-h-[420px]">
              <ProblemDiagram spec={problem.diagram} />
            </div>
          ) : (
            <span className="text-[10px] tracking-[0.3em] text-white/22">RESOLVA NO PAPEL</span>
          )}
        </div>
      </div>

      {/* answers */}
      <div className="flex flex-col gap-4 pt-6">
        {answered && problem ? (
          <div className="confirm flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`block h-[9px] w-[9px] rounded-full ${
                  chosen?.correct ? "bg-white" : "border border-white/70"
                }`}
              />
              <span className="text-[11px] tracking-[0.3em] text-white">
                {chosen?.correct ? "CORRETO" : "REVEJA"}
              </span>
            </span>
            {!chosen?.correct && misconception ? (
              <p className="max-w-[620px] text-[12.5px] leading-relaxed text-white/65">
                <span className="text-white/90">{misconception.title}:</span>{" "}
                {misconception.explanation}
              </p>
            ) : null}
            {!chosen?.correct ? (
              <button
                type="button"
                onClick={() => actions.openConcept(conceptId)}
                className="text-[10px] tracking-[0.26em] text-white/55 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
              >
                VER NO CONCEITO →
              </button>
            ) : null}
          </div>
        ) : null}

        {alternativesVisible && problem ? (
          <div
            role="group"
            aria-label="Alternativas"
            className={`grid gap-3 ${
              problem.alternatives.length === 2
                ? "max-w-[560px] grid-cols-2"
                : problem.alternatives.length === 3
                  ? "grid-cols-3"
                  : problem.alternatives.length === 4
                    ? "grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-2 lg:grid-cols-5"
            }`}
          >
            {problem.alternatives.map((alternative) => {
              const isChosen = selected === alternative.id;
              const showCorrect = answered && alternative.correct;
              return (
                <button
                  key={alternative.id}
                  type="button"
                  disabled={answered}
                  onClick={() => handleSelect(alternative.id)}
                  className={`group flex min-h-[74px] items-center gap-4 rounded-[18px] border px-5 text-left transition-all duration-200 ${
                    showCorrect
                      ? "border-white bg-white text-black"
                      : isChosen
                        ? "border-white/80 border-dashed bg-white/[0.04]"
                        : "border-white/30 hover:border-white/70 hover:bg-white/[0.03]"
                  } ${answered && !showCorrect && !isChosen ? "opacity-40" : ""}`}
                >
                  <span
                    className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border text-[11px] tracking-[0.06em] transition-colors ${
                      showCorrect
                        ? "border-black/20 bg-black text-white"
                        : "border-white/40 text-white/75 group-hover:border-white/80 group-hover:text-white"
                    }`}
                  >
                    {alternative.id}
                  </span>
                  <span className="tabular truncate font-display text-[17px] font-light">
                    {alternative.display}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowHint((value) => !value)}
            className="flex min-h-[44px] items-center gap-3 text-[11px] tracking-[0.26em] text-white/55 transition-colors hover:text-white"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 text-[11px]"
            >
              ?
            </span>
            DICA
          </button>

          <div className="flex items-center gap-3">
            {advanced && !revealed && !answered ? (
              <button type="button" onClick={() => setRevealed(true)} className="btn">
                VER RESPOSTAS
              </button>
            ) : null}
            <button
              type="button"
              disabled={!answered}
              onClick={() => {
                setCount((value) => value + 1);
                next();
              }}
              className="btn btn-solid"
            >
              PRÓXIMA
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="text-[9.5px] tracking-[0.22em] text-white/38">{label}</span>
      <span className="tabular font-display text-[14px] text-white">{value}</span>
    </span>
  );
}
