import { Lazy } from './core';

export type PartialFunction<A, B> = (a: A) => B | undefined;

export const pure: <B>(b: B) => PartialFunction<any, B> = x => () => x;
export const empty: PartialFunction<any, never> = () => undefined;

export const map: <B, C>(
  f: (b: B) => C,
) => <A>(fab: PartialFunction<A, B>) => PartialFunction<A, C> = f => fab =>
  andThen_(fab, f);

export const map_: <A, B, C>(
  fab: PartialFunction<A, B>,
  f: (b: B) => C,
) => PartialFunction<A, C> = (fab, f) => x => {
  const b = fab(x);
  return b && f(b);
};

export const andThen: <B, C>(
  fbc: PartialFunction<B, C>,
) => <A>(fab: PartialFunction<A, B>) => PartialFunction<A, C> = fbc => fab =>
  andThen_(fab, fbc);

export const andThen_: <A, B, C>(
  fab: PartialFunction<A, B>,
  fbc: PartialFunction<B, C>,
) => PartialFunction<A, C> = (fab, fbc) => x => {
  const b = fab(x);
  return b && fbc(b);
};

export const alt: <A, B>(
  other: PartialFunction<A, B>,
) => (self: PartialFunction<A, B>) => PartialFunction<A, B> = other => self =>
  alt_(self, other);

export const alt_: <A, B>(
  self: PartialFunction<A, B>,
  other: PartialFunction<A, B>,
) => PartialFunction<A, B> = (self, other) => x => self(x) ?? other(x);

export const orDefault: <B>(
  b: Lazy<B>,
) => <A>(fab: PartialFunction<A, B>) => (a: A) => B = b => fab =>
  orDefault_(fab, b);

export const orDefault_: <A, B>(
  fab: PartialFunction<A, B>,
  b: Lazy<B>,
) => (a: A) => B = (fab, b) => x => fab(x) ?? b();
