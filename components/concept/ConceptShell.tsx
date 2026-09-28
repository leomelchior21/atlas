"use client";

import type { ReactNode } from "react";
import type { ConceptDefinition } from "@/content/concepts";

export function ConceptShell({
  meta,
  journey,
  onJourney,
  toolbar,
  equation,
  controls,
  extraLeft,
  children,
  footer,
}: {
  meta: ConceptDefinition;
  journey: number;
  onJourney: (index: number) => void;
  toolbar?: ReactNode;
  equation?: ReactNode;
  controls: ReactNode;
  extraLeft?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="viewport-fit flex flex-col bg-black">
      {toolbar ? (
        <div className="shrink-0 border-b border-white/8 px-7 pb-4 pt-3.5">{toolbar}</div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-6 px-7 pb-2 pt-4 lg:flex-row lg:gap-8">
        {/* left column */}
        <div className="scroll-thin flex w-full shrink-0 flex-col lg:min-h-0 lg:w-[26%] lg:min-w-[292px] lg:max-w-[372px] lg:overflow-y-auto lg:pr-1">
          <button
            type="button"
            onClick={() => onJourney(-1)}
            className="group mb-6 flex w-fit items-center gap-3 text-[10px] tracking-[0.3em] text-white/50 transition-colors hover:text-white"
          >
            <span aria-hidden="true" className="text-[13px]">
              ←
            </span>
            CONCEITO
          </button>

          <p className="micro mb-4">{meta.eyebrow}</p>
          <h1 className="t-title text-white">{meta.title}</h1>
          <p className="t-body mt-5 max-w-[340px]">{meta.explanation}</p>

          <span className="mt-7 mb-6 block h-px w-full bg-white/10" />

          {equation ?? (
            <div className="font-display text-[26px] font-light tracking-[0.04em] text-white">
              {meta.equation}
            </div>
          )}

          <span className="mt-7 mb-6 block h-px w-full bg-white/10" />

          <ul className="flex flex-col gap-3.5">
            {meta.legend.map((item) => (
              <li key={item.label} className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className={`mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center text-[11px] leading-none ${
                    item.emphasis ? "text-white" : "text-white/55"
                  }`}
                >
                  {item.filled ? "●" : "○"}
                </span>
                <span className="text-[12.5px] leading-[1.55]">
                  <span className="text-white/85">{item.label}</span>
                  <span className="mx-2 text-white/25">→</span>
                  <span className="text-white/55">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          {extraLeft}

          {footer ? <div className="mt-auto hidden pt-6 lg:block">{footer}</div> : null}
        </div>

        {/* visualization */}
        <div className="relative min-h-[320px] flex-1 lg:min-h-0">{children}</div>

        {/* right column */}
        <div className="scroll-thin flex w-full shrink-0 flex-col gap-6 lg:min-h-0 lg:w-[26%] lg:min-w-[272px] lg:max-w-[372px] lg:overflow-y-auto lg:pr-1">
          {controls}
        </div>
      </div>

      <JourneyNav
        steps={meta.journey}
        active={journey}
        onChange={(index) => onJourney(index)}
      />
    </div>
  );
}

function JourneyNav({
  steps,
  active,
  onChange,
}: {
  steps: readonly string[];
  active: number;
  onChange: (index: number) => void;
}) {
  return (
    <nav
      className="flex items-end justify-center gap-0 px-7 pb-6 pt-4"
      aria-label="Percurso do conceito"
    >
      {steps.map((step, index) => {
        const isActive = index === active;
        return (
          <div key={step} className="flex items-center">
            <button
              type="button"
              onClick={() => onChange(index)}
              aria-current={isActive ? "step" : undefined}
              className="group flex flex-col items-center gap-3 px-2"
            >
              <span
                aria-hidden="true"
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? "h-[13px] w-[13px] bg-white"
                    : "h-[11px] w-[11px] border border-white/45 group-hover:border-white"
                }`}
              />
              <span
                className={`text-[10px] tracking-[0.26em] transition-colors ${
                  isActive ? "text-white" : "text-white/40 group-hover:text-white/75"
                }`}
              >
                {step}
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span className="mb-[26px] block h-px w-[52px] bg-white/18 sm:w-[74px]" />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function HintPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-auto rounded-[14px] border border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-white/25 text-[10px]"
        >
          ◎
        </span>
        <span className="text-[10px] tracking-[0.28em] text-white/70">{title}</span>
      </div>
      <p className="mt-3 text-[12.5px] leading-[1.65] text-white/55">{text}</p>
    </div>
  );
}

export function LivePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="micro mb-1">{title}</p>
      {children}
    </div>
  );
}
