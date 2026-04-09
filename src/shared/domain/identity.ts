export type Brand<T, B extends string> = T & { readonly _brand: B };
export type Id<B extends string> = Brand<string, B>;

export const createId = <B extends string>(brand: B) => (): Id<B> =>
  crypto.randomUUID() as Id<B>;

export const castId = <B extends string>(brand: B) => (raw: string): Id<B> =>
  raw as Id<B>;
