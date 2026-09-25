"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { nodeById } from "@/content";

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
  const [pulse, setPulse] = useState(0);
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
    setPulse((value) => value + 1);
    actions.answerQuestion({
      problem,
      correct: alternative.correct,
      ...(alternative.misconceptionId ? { misconceptionId: alternative.misconceptionId } : {}),
    });
  };

  const advanced = difficulty === "avancada";
  const alternativesVisible = !advanced || revealed;
  const needsDiagram =
    !advanced || /ao lado|figura|diagrama|recorte|ret[âa]ngulo de|tri[âa]ngulo ao/i.test(problem?.prompt ?? "");
  const showDiagram = Boolean(problem) && needsDiagram && problem?.diagram.kind !== "none";

  return (
    <div className="viewport-fit flex flex-col bg-black px-7 pb-5 pt-3">
      <header className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/50 transition-colors hover:text-white"
          >
            <span aria-hidden="true" className="text-[13px]">
              ←
            </span>
            MARATONA
          </button>
          <div className="flex flex-col gap-2">
            <span className="tabular text-[10px] tracking-[0.2em] text-white/35">
              {count} / ∞
            </span>
            <span className="relative block h-px w-[220px] bg-white/15 lg:w-[320px]">
              <span
                className="absolute inset-y-0 left-0 bg-white/70"
                style={{ width: `${Math.min(100, 12 + (count - 1) * 7)}%` }}
              />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {DIFFICULTIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => actions.setDifficulty(item as DifficultyId)}
              className={`min-h-[36px] rounded-full border px-5 text-[10px] tracking-[0.24em] transition-colors ${
                difficulty === item
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-white/55 hover:border-white/50 hover:text-white"
              }`}
            >
              {DIFFICULTY_LABELS[item]}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-baseline gap-4">
          <p className="micro">
            {concept?.title ?? ""} · {problem?.familyTitle ?? ""}
          </p>
          {problem ? (
            <span className="tabular hidden text-[10px] tracking-[0.18em] text-white/25 lg:inline">
              {problem.seed}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-6">
          <HudStat label="XP" value={String(progress.xp)} />
          <HudStat label="DOMÍNIO" value={`${Math.round(mastery.overall)}%`} />
          <HudStat label="SEQUÊNCIA" value={String(record?.streak ?? 0)} />
          <span className="hidden text-[10px] tracking-[0.2em] text-white/30 xl:inline">
            {masteryLabel(mastery.overall)}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 pt-7 lg:flex-row lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="max-w-[620px] font-display text-[21px] font-light leading-[1.55] text-white xl:text-[24px]">
            {problem?.prompt ?? (failure ?? "Gerando questão…")}
          </h1>

          {problem?.formula ? (
            <p className="mt-5 font-display text-[15px] tracking-[0.06em] text-white/45">
              {problem.formula}
            </p>
          ) : null}

          {showDiagram && problem ? (
            <div className="mt-5 min-h-[220px] flex-1 lg:hidden">
              <ProblemDiagram spec={problem.diagram} />
            </div>
          ) : null}

          {showHint ? (
            <div className="reveal mt-6 max-w-[560px] border-l border-white/25 pl-4">
              <p className="micro mb-2">DICA</p>
              <p className="text-[13px] leading-relaxed text-white/55">
                {FAMILY_HINTS[problem?.familyId ?? ""] ??
                  "Releia o enunciado e identifique as grandezas conhecidas antes de calcular."}
              </p>
            </div>
          ) : null}
        </div>

        {showDiagram && problem ? (
          <div className="hidden min-h-0 flex-1 lg:block">
            <ProblemDiagram spec={problem.diagram} />
          </div>
        ) : (
          <div className="hidden min-h-0 flex-1 items-center justify-center lg:flex">
            <span className="text-[10px] tracking-[0.3em] text-white/20">RESOLVA NO PAPEL</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-4">
        {answered && problem ? (
          <div key={pulse} className="confirm flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`block h-[9px] w-[9px] rounded-full ${
                  chosen?.correct ? "bg-white" : "border border-white/60"
                }`}
              />
              <span className="text-[11px] tracking-[0.32em] text-white">
                {chosen?.correct ? "CORRETO" : "REVEJA"}
              </span>
            </span>
            {!chosen?.correct && misconception ? (
              <p className="max-w-[620px] text-[12.5px] leading-relaxed text-white/60">
                <span className="text-white/85">{misconception.title}:</span>{" "}
                {misconception.explanation}
              </p>
            ) : null}
            {!chosen?.correct ? (
              <button
                type="button"
                onClick={() => actions.openConcept(conceptId)}
                className="text-[10px] tracking-[0.28em] text-white/50 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
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
                ? "grid-cols-2 max-w-[520px]"
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
                  className={`group flex min-h-[46px] items-center gap-3 rounded-[12px] border px-4 py-2 text-left transition-colors ${
                    showCorrect
                      ? "border-white bg-white/[0.06]"
                      : isChosen
                        ? "border-white/70 border-dashed"
                        : "border-white/18 hover:border-white/55"
                  } ${answered && !showCorrect && !isChosen ? "opacity-45" : ""}`}
                >
                  <span
                    className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-[10px] tracking-[0.08em] ${
                      showCorrect ? "border-white bg-white text-black" : "border-white/40 text-white/70"
                    }`}
                  >
                    {alternative.id}
                  </span>
                  <span className="tabular truncate font-display text-[15px] text-white">
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
            className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/45 transition-colors hover:text-white"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-[10px]"
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
      <span className="text-[9px] tracking-[0.24em] text-white/35">{label}</span>
      <span className="tabular font-display text-[13px] text-white">{value}</span>
    </span>
  );
}
