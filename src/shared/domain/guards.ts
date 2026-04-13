export const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== undefined && value !== null;

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;
