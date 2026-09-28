"use client";

import type { ReactNode } from "react";

export function EquationDisplay({
  main,
  live,
}: {
  main: string;
  live?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-display text-[26px] font-light tracking-[0.07em] text-white">
        {main}
      </span>
      {live ? (
        <span className="tabular text-[12px] tracking-[0.04em] text-white/45">{live}</span>
      ) : null}
    </div>
  );
}

export function ValueSlider({
  symbol,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  display,
  accent,
}: {
  symbol: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  display?: string;
  accent?: boolean;
}) {
  return (
    <label className="flex items-center gap-4">
      <span
        className={`w-4 shrink-0 font-display text-[14px] ${
          accent ? "text-white" : "text-white/70"
        }`}
      >
        {symbol}
      </span>
      <input
        type="range"
        className="atlas-range flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`Valor de ${symbol}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="tabular w-12 shrink-0 text-right font-display text-[14px] text-white">
        {display ?? value.toFixed(1)}
      </span>
    </label>
  );
}

export function ValueRows({
  rows,
  emphasisLast,
}: {
  rows: Array<{ left: string; middle?: string; right: string; emphasis?: boolean }>;
  emphasisLast?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {rows.map((row, index) => (
        <div
          key={`${row.left}-${index}`}
          className={`grid grid-cols-[1fr_auto_1fr_auto_1fr] items-baseline gap-2 py-[7px] ${
            row.emphasis ? "text-white" : "text-white/65"
          } ${emphasisLast && index === rows.length - 1 ? "border-t border-white/12 pt-3" : ""}`}
        >
          <span className="font-display text-[13px]">{row.left}</span>
          <span className="text-white/25">=</span>
          <span className="tabular text-right text-[13px]">{row.middle ?? ""}</span>
          <span className="text-white/25">=</span>
          <span className="tabular text-right font-display text-[14px]">{row.right}</span>
        </div>
      ))}
    </div>
  );
}

export function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="text-[10px] tracking-[0.24em] text-white/45">{label}</span>
      <span className="tabular font-display text-[14px] text-white">{value}</span>
    </div>
  );
}

export function ChoiceTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {label ? <p className="micro">{label}</p> : null}
      <div className="flex flex-wrap gap-2" role="tablist">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.id)}
              className={`min-h-[34px] rounded-full border px-4 text-[10px] tracking-[0.22em] transition-colors ${
                active
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ToolBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/**
 * The single control surface of a concept. Every experience is adjusted here,
 * with sliders and option buttons, so the interaction never changes shape.
 */
export function ControlBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
      {children}
    </div>
  );
}

export function ControlGroup({
  label,
  children,
  wide,
}: {
  label?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2.5 ${wide ? "w-full lg:max-w-[460px]" : ""}`}>
      {label ? <p className="micro">{label}</p> : null}
      {children}
    </div>
  );
}
