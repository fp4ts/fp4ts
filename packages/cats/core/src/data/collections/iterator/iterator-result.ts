// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
): IteratorResult<B> => (!r.done ? pure(f(r.value)) : done);

export const flatMap_ = <A, B>(
  r: IteratorResult<A>,
  f: (a: A) => IteratorResult<B>,
): IteratorResult<B> => (!r.done ? f(r.value) : done);

export const orElse_ = <A>(
  lhs: IteratorResult<A>,
  rhs: () => IteratorResult<A>,
): IteratorResult<A> => (lhs.done ? rhs() : lhs);
