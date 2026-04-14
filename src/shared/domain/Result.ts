export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
  r.ok ? ok(fn(r.value)) : r;
export const flatMap = <T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> =>
  r.ok ? fn(r.value) : r;
