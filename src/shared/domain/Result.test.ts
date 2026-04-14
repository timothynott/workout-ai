import { describe, expect, it } from 'vitest';
import { err, flatMap, map, ok } from './Result';

describe('ok', () => {
  it('creates a success result', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });
});

describe('err', () => {
  it('creates a failure result', () => {
    const r = err('something went wrong');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('something went wrong');
  });
});

describe('map', () => {
  it('transforms the value on success', () => {
    const r = map(ok(2), (n) => n * 3);
    expect(r).toEqual(ok(6));
  });

  it('passes through the error on failure', () => {
    const r = map(err('oops'), (n: number) => n * 3);
    expect(r).toEqual(err('oops'));
  });
});

describe('flatMap', () => {
  it('chains success results', () => {
    const r = flatMap(ok(2), (n) => ok(n * 3));
    expect(r).toEqual(ok(6));
  });

  it('short-circuits on failure', () => {
    const r = flatMap(err('oops'), (n: number) => ok(n * 3));
    expect(r).toEqual(err('oops'));
  });

  it('propagates a failure returned by the fn', () => {
    const r = flatMap(ok(2), () => err('downstream failure'));
    expect(r).toEqual(err('downstream failure'));
  });
});
