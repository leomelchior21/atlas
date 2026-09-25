export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
  detail?: Record<string, unknown>;
}

export function issue(
  code: string,
  message: string,
  severity: IssueSeverity = "error",
  detail?: Record<string, unknown>,
): ValidationIssue {
  return { code, message, severity, ...(detail ? { detail } : {}) };
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

export function finite(value: number, code: string, label = "value"): ValidationIssue | null {
  if (!Number.isFinite(value)) return issue(code, `${label} is not finite (${value})`);
  return null;
}

export function positive(value: number, code: string, label = "value", minimum = 1e-9): ValidationIssue | null {
  if (!Number.isFinite(value) || value < minimum) {
    return issue(code, `${label} must be >= ${minimum} (got ${value})`);
  }
  return null;
}

export function compress(issues: (ValidationIssue | null)[]): ValidationIssue[] {
  return issues.filter((i): i is ValidationIssue => i !== null);
}

export function uniqueNumbers(values: number[], tolerance = 1e-6): boolean {
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const scale = Math.max(1, Math.abs(values[i]), Math.abs(values[j]));
      if (Math.abs(values[i] - values[j]) <= tolerance * scale) return false;
    }
  }
  return true;
}

export function uniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length;
}

export function withinTolerance(a: number, b: number, relative = 1e-3): boolean {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= relative * scale;
}
