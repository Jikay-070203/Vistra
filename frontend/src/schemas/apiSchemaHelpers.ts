export function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(label + ' must be an object');
  }
  return value as Record<string, unknown>;
}

export function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(label + ' must be an array');
  return value;
}

export function string(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new TypeError(label + ' must be a string');
  return value;
}

export function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(label + ' must be a finite number');
  }
  return value;
}

export function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(label + ' must be a boolean');
  return value;
}

export function nullable<T>(value: unknown, parse: (value: unknown, label: string) => T, label: string): T | null {
  return value === null ? null : parse(value, label);
}

export function objectList(value: unknown, label: string): Record<string, unknown>[] {
  return list(value, label).map((item, index) => record(item, label + '[' + index + ']'));
}

export function oneOf<T extends string>(value: unknown, choices: readonly T[], label: string): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new TypeError(label + ' has an unsupported value');
  }
  return value as T;
}
