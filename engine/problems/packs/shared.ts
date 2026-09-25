import { issue, type ValidationIssue } from "@/lib/validation";
import { isInteger } from "@/lib/format";
import type { DraftValidator, ProblemDraft } from "../types";

export function geometricValidator(conceptKey: string): DraftValidator {
  return (draft) => {
    const issues: ValidationIssue[] = [];
    const answer = draft.answerValue;
    if (!Number.isFinite(answer)) {
      issues.push(issue(`${conceptKey}-ANSWER-NAN`, "answer is not finite", "error"));
    } else if (answer < 0) {
      issues.push(issue(`${conceptKey}-ANSWER-NEGATIVE`, "answer must not be negative", "error", { answer }));
    } else if (answer > 1_000_000) {
      issues.push(issue(`${conceptKey}-ANSWER-HUGE`, "answer is unrealistically large", "error", { answer }));
    }
    return issues;
  };
}

export const promptValidator: DraftValidator = (draft) => {
  const issues: ValidationIssue[] = [];
  if (draft.prompt.trim().length < 18) {
    issues.push(issue("PROMPT-SHORT", "prompt is too short", "error", { prompt: draft.prompt }));
  }
  if (/undefined|NaN|Infinity|\[object/.test(draft.prompt)) {
    issues.push(issue("PROMPT-BROKEN", "prompt contains invalid tokens", "error", { prompt: draft.prompt }));
  }
  return issues;
};

export const precisionValidatorFactory =
  (conceptKey: string): DraftValidator =>
  (draft) => {
    const issues: ValidationIssue[] = [];
    const display = draft.answerDisplay;
    if (!display) return issues;
    if (display.length > 16) {
      issues.push(issue(`${conceptKey}-DISPLAY-LONG`, "answer display is too long", "error", { display }));
    }
    const numeric = Number(display.replace(",", "."));
    if (Number.isFinite(numeric) && !/√|\p{L}/u.test(display)) {
      const scale = Math.max(1, Math.abs(draft.answerValue));
      if (Math.abs(numeric - draft.answerValue) > 0.01 * scale + 0.005) {
        issues.push(
          issue(`${conceptKey}-DISPLAY-MISMATCH`, "display does not match value", "error", {
            display,
            answerValue: draft.answerValue,
          }),
        );
      }
    }
    return issues;
  };
