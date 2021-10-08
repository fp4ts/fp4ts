export const pure = <A>(x: A): IteratorYieldResult<A> => ({
  value: x,
  done: false,
});

export const done: IteratorResult<never> = Object.freeze({
  value: undefined as never,
  done: true,
});

export const orElse =
  <AA>(rhs: () => IteratorResult<AA>) =>
  <A extends AA>(lhs: IteratorResult<A>): IteratorResult<AA> =>
    orElse_(lhs, rhs);

export const map_ = <A, B>(
  r: IteratorResult<A>,
  f: (a: A) => B,
): IteratorResult<B> => (r.done ? pure(f(r.value)) : done);

export const orElse_ = <A>(
  lhs: IteratorResult<A>,
  rhs: () => IteratorResult<A>,
): IteratorResult<A> => (lhs.done ? rhs() : lhs);
