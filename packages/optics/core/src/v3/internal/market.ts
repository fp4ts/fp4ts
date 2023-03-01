// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Functor, Left, Right } from '@fp4ts/cats';
import { Choice, Profunctor } from '@fp4ts/cats-profunctor';
import { $, $type, F1, lazy, TyK, TyVar, unsafeCoerce } from '@fp4ts/core';

export interface Market<A, B, S, T> {
  readonly getOrModify: (s: S) => Either<T, A>;
  readonly reverseGet: (b: B) => T;
}

export const Market = function <A, B, S, T>(
  getOrModify: (s: S) => Either<T, A>,
  reverseGet: (b: B) => T,
): Market<A, B, S, T> {
  return { getOrModify, reverseGet };
};

// -- Instances

const marketFunctor = lazy(
  <A, B, S>(): Functor<$<MarketF, [A, B, S]>> =>
    Functor.of({
      map_: <T, U>(
        { getOrModify, reverseGet }: Market<A, B, S, T>,
        f: (t: T) => U,
      ) => ({
        getOrModify: F1.andThen(getOrModify, ea => ea.leftMap(f)),
        reverseGet: F1.andThen(reverseGet, f),
      }),
    }),
) as <A, B, S>() => Functor<$<MarketF, [A, B, S]>>;

const marketProfunctor = lazy(
  <A, B>(): Profunctor<$<MarketF, [A, B]>> =>
    Profunctor.of({
      dimap_: <S, T, U, V>(
        { getOrModify, reverseGet }: Market<A, B, S, T>,
        f: (u: U) => S,
        g: (t: T) => V,
      ) => ({
        getOrModify: F1.compose(
          F1.andThen(getOrModify, ea => ea.leftMap(g)),
          f,
        ),
        reverseGet: F1.andThen(reverseGet, g),
      }),
      lmap_: <S, T, U>(
        { getOrModify, reverseGet }: Market<A, B, S, T>,
        f: (u: U) => S,
      ) => ({
        getOrModify: F1.compose(getOrModify, f),
        reverseGet,
      }),
      rmap_: <S, T, V>(
        { getOrModify, reverseGet }: Market<A, B, S, T>,
        g: (t: T) => V,
      ) => ({
        getOrModify: F1.andThen(getOrModify, ea => ea.leftMap(g)),
        reverseGet: F1.andThen(reverseGet, g),
      }),
    }),
) as <A, B>() => Profunctor<$<MarketF, [A, B]>>;

export const marketChoice = lazy(
  <A, B>(): Choice<$<MarketF, [A, B]>> =>
    Choice.of({
      ...marketProfunctor(),

      left: <C>() => left,
      right: <C>() => right,
    }),
) as <A, B>() => Choice<$<MarketF, [A, B]>>;

const left = <A, B, C, S, T>({
  getOrModify,
  reverseGet,
}: Market<A, B, S, T>): Market<A, B, Either<S, C>, Either<T, C>> => ({
  getOrModify: sc => {
    if (sc.isRight()) return Left<Either<T, C>, A>(sc);
    const ta = getOrModify(sc.getLeft);
    return ta.isLeft() ? Left(ta) : unsafeCoerce(ta);
  },
  reverseGet: F1.andThen(reverseGet, Left),
});

const right = <A, B, C, S, T>({
  getOrModify,
  reverseGet,
}: Market<A, B, S, T>): Market<A, B, Either<C, S>, Either<C, T>> => ({
  getOrModify: cs => {
    if (cs.isLeft()) return Left<Either<C, T>, A>(cs);
    const ta = getOrModify(cs.get);
    return ta.isLeft() ? Left(ta.swapped) : unsafeCoerce(ta);
  },
  reverseGet: F1.andThen(reverseGet, Right),
});

Market.Functor = marketFunctor;
Market.Profunctor = marketProfunctor;
Market.Choice = marketChoice;

// -- HKT

export interface MarketF extends TyK<[unknown, unknown, unknown, unknown]> {
  [$type]: Market<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>
  >;
}
