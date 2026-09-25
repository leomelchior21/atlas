"use client";

import { useState } from "react";
import { AtlasLogo } from "@/components/atlas/AtlasLogo";
import { ALL_YEARS, YEAR_LABELS } from "@/types/content";

export function Onboarding({
  onComplete,
}: {
  onComplete: (name: string, year: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [year, setYear] = useState<number | null>(null);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
      <OrbitalBackdrop />

      <div className="relative z-10 flex w-full max-w-[560px] flex-col items-center px-8">
        <AtlasLogo size={72} stack className="mb-16 fade-in" />

        {step === 0 ? (
          <div className="w-full rise-in" key="step-0">
            <div className="mb-10 text-center">
              <p className="micro mb-4">SEU ATLAS PESSOAL</p>
              <h1 className="font-display text-[32px] font-light leading-tight tracking-[0.02em] text-white">
                Como podemos
                <br />
                te chamar?
              </h1>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim()) return;
                setStep(1);
              }}
              className="flex flex-col items-center"
            >
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 24))}
                placeholder="seu nome"
                aria-label="Seu nome"
                className="w-full border-b border-white/20 bg-transparent pb-4 text-center font-display text-[24px] font-light tracking-[0.06em] text-white placeholder:text-white/20 focus:border-white/60"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="btn mt-12 w-full max-w-[280px] justify-center"
              >
                CONTINUAR
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full rise-in" key="step-1">
            <div className="mb-10 text-center">
              <p className="micro mb-4">SEU PONTO NO MAPA</p>
              <h1 className="font-display text-[32px] font-light leading-tight tracking-[0.02em] text-white">
                Em que ano
                <br />
                você está?
              </h1>
            </div>

            <div
              className="grid grid-cols-4 gap-2"
              role="radiogroup"
              aria-label="Ano escolar"
            >
              {ALL_YEARS.map((value) => {
                const selected = year === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setYear(value)}
                    className={`flex min-h-[56px] items-center justify-center rounded-full border text-[11px] tracking-[0.16em] transition-colors ${
                      selected
                        ? "border-white bg-white text-black"
                        : "border-white/18 text-white/70 hover:border-white/50 hover:text-white"
                    } ${value === 10 ? "col-span-4 mt-1 sm:col-span-1 sm:mt-0" : ""}`}
                  >
                    {YEAR_LABELS[value].toUpperCase()}
                  </button>
                );
              })}
            </div>

            <p className="mt-8 text-center text-[12px] leading-relaxed text-white/35">
              Isso não bloqueia nada. O mapa destaca o que é mais relevante para você agora.
            </p>

            <button
              type="button"
              disabled={year === null}
              onClick={() => year !== null && onComplete(name, year)}
              className="btn btn-solid mx-auto mt-10 flex w-full max-w-[280px] justify-center"
            >
              ENTRAR NO ATLAS
            </button>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-4 w-full text-center text-[10px] tracking-[0.28em] text-white/30 hover:text-white/60"
            >
              VOLTAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrbitalBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg
        viewBox="0 0 800 800"
        className="h-[min(120vw,120vh)] w-[min(120vw,120vh)] opacity-[0.14]"
        aria-hidden="true"
      >
        <g stroke="#ffffff" fill="none" strokeWidth="1">
          <circle cx="400" cy="400" r="120" strokeOpacity="0.7" />
          <circle cx="400" cy="400" r="240" strokeOpacity="0.45" strokeDasharray="2 10" />
          <circle cx="400" cy="400" r="360" strokeOpacity="0.28" strokeDasharray="1 14" />
          <path d="M400 40 L400 760" strokeOpacity="0.12" />
          <path d="M40 400 L760 400" strokeOpacity="0.12" />
          <path d="M118 118 L682 682" strokeOpacity="0.08" />
          <path d="M682 118 L118 682" strokeOpacity="0.08" />
        </g>
      </svg>
    </div>
  );
}
