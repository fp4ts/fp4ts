// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  curry,
  id,
  Kind,
  lazy,
  tuple,
  TyK,
  TyVar,
  uncurry,
  untuple,
} from '@fp4ts/core';
import {
  Bifunctor,
  Comonad,
  Defer,
  Distributive,
  Either,
  Function1F,
  Functor,
  Left,
  Monad,
  Right,
  Traversable,
  TupleLeftF,
} from '@fp4ts/cats';
import { Arrow, ArrowApply, ArrowChoice, ArrowLoop } from '@fp4ts/cats-arrow';
import {
  Closed,
  Corepresentable,
  Costrong,
  Profunctor,
  Representable,
  Strong,
} from '@fp4ts/cats-profunctor';
import { Conjoined } from './conjoined';
import { Indexable } from './indexable';

/**
 * A function with access to an index `I`.
 */
export type Indexed<I, A, B> = (a: A, i: I) => B;
export const Indexed = function <I, A, B>(
  runIndexed: (a: A, i: I) => B,
): Indexed<I, A, B> {
  return runIndexed;
};

// -- Operators

export function reindex<P, J, I, A, B, R>(
  P: Indexable<P, J>,
  ij: (i: I) => J,
  f: (k: Indexed<I, A, B>) => R,
): (pab: Kind<P, [A, B]>) => R {
  return g => {
    const idxg = P.indexed(g);
    return f((a, i) => idxg(a, ij(i)));
  };
}

// -- Instances

const indexedProfunctor = lazy(
  <I>(): Profunctor<$<IndexedF, [I]>> =>
    Profunctor.of({
      dimap_:
        <A, B, C, D>(pab: Indexed<I, A, B>, f: (c: C) => A, g: (b: B) => D) =>
        (c: C, i: I): D =>
          g(pab(f(c), i)),
      lmap_:
        <A, B, C>(pab: Indexed<I, A, B>, f: (c: C) => A) =>
        (c: C, i: I): B =>
          pab(f(c), i),
      rmap_:
        <A, B, D>(pab: Indexed<I, A, B>, g: (b: B) => D) =>
        (a: A, i: I): D =>
          g(pab(a, i)),
    }),
) as <I>() => Profunctor<$<IndexedF, [I]>>;

const indexedStrong = lazy(
  <I>(): Strong<$<IndexedF, [I]>> =>
    Strong.of({
      ...indexedProfunctor<I>(),
      first:
        <C>() =>
        <A, B>(pab: Indexed<I, A, B>) =>
        ([a, c]: [A, C], i: I) =>
          [pab(a, i), c],

      second:
        <C>() =>
        <A, B>(pab: Indexed<I, A, B>) =>
        ([c, a]: [C, A], i: I) =>
          [c, pab(a, i)],
    }),
) as <I>() => Strong<$<IndexedF, [I]>>;

const indexedCostrong = lazy(
  <I>(): Costrong<$<IndexedF, [I]>> =>
    Costrong.of<$<IndexedF, [I]>>({
      ...indexedProfunctor<I>(),
      unfirst_:
        <F, A, B, C>(
          F: Defer<F>,
          ab: Indexed<I, [A, Kind<F, [C]>], [B, Kind<F, [C]>]>,
        ): Indexed<I, A, B> =>
        (a, i) => {
          const bfc: [B, Kind<F, [C]>] = ab([a, F.defer(() => bfc[1])], i);
          return bfc[0];
        },

      unsecond_:
        <F, A, B, C>(
          F: Defer<F>,
          ab: Indexed<I, [Kind<F, [C]>, A], [Kind<F, [C]>, B]>,
        ): Indexed<I, A, B> =>
        (a, i) => {
          const fcb: [Kind<F, [C]>, B] = ab([F.defer(() => fcb[0]), a], i);
          return fcb[1];
        },
    }),
) as <I>() => Costrong<$<IndexedF, [I]>>;

const indexedRepresentable = lazy(
  <I>(): Representable<$<IndexedF, [I]>, $<Function1F, [I]>> =>
    Representable.of<$<IndexedF, [I]>, $<Function1F, [I]>>({
      ...indexedStrong<I>(),
      F: Monad.Function1<I>(),
      sieve: curry,
      tabulate: uncurry,
    }),
) as <I>() => Representable<$<IndexedF, [I]>, $<Function1F, [I]>>;

const indexedCorepresentable = lazy(
  <I>(): Corepresentable<$<IndexedF, [I]>, TupleLeftF<I>> =>
    Corepresentable.of<$<IndexedF, [I]>, TupleLeftF<I>>({
      ...indexedCostrong<I>(),
      C: Bifunctor.Tuple2.leftFunctor<I>(),
      cosieve: tuple,
      cotabulate: untuple,
    }),
) as <I>() => Corepresentable<$<IndexedF, [I]>, TupleLeftF<I>>;

const indexedClosed = lazy(
  <I>(): Closed<$<IndexedF, [I]>> =>
    Closed.of<$<IndexedF, [I]>>({
      ...indexedProfunctor(),
      closed:
        <X>() =>
        <A, B>(ab: Indexed<I, A, B>): Indexed<I, (x: X) => A, (x: X) => B> =>
        (xa: (x: X) => A, i: I) =>
        (x: X) =>
          ab(xa(x), i),
    }),
) as <I>() => Closed<$<IndexedF, [I]>>;

const indexedArrow = lazy(
  <I>(): Arrow<$<IndexedF, [I]>> =>
    Arrow.of({
      ...indexedStrong<I>(),

      lift: id as <A, B>(f: (a: A) => B) => Indexed<I, A, B>,
      id: <A>() => id as Indexed<I, A, A>,

      compose_:
        <A, B, C>(
          bc: Indexed<I, B, C>,
          ab: Indexed<I, A, B>,
        ): Indexed<I, A, C> =>
        (a: A, i: I) =>
          bc(ab(a, i), i),
    }),
) as <I>() => Arrow<$<IndexedF, [I]>>;

const indexedArrowLoop = lazy(
  <I>(): ArrowLoop<$<IndexedF, [I]>> =>
    ArrowLoop.of({
      ...indexedArrow<I>(),
      ...indexedCostrong<I>(),
    }),
) as <I>() => ArrowLoop<$<IndexedF, [I]>>;

const indexedArrowApply = lazy(
  <I>(): ArrowApply<$<IndexedF, [I]>> =>
    ArrowApply.of({
      ...indexedArrow<I>(),

      app:
        <A, B>() =>
        ([fab, a]: [Indexed<I, A, B>, A], i: I) =>
          fab(a, i),
    }),
) as <I>() => ArrowApply<$<IndexedF, [I]>>;

const indexedArrowChoice = lazy(
  <I>(): ArrowChoice<$<IndexedF, [I]>> =>
    ArrowChoice.of({
      ...indexedArrow<I>(),

      choose_:
        <A, B, C, D>(
          f: Indexed<I, A, C>,
          g: Indexed<I, B, D>,
        ): Indexed<I, Either<A, B>, Either<C, D>> =>
        (ab, i) =>
          ab.isEmpty ? Left(f(ab.getLeft, i)) : Right(g(ab.get, i)),
    }),
) as <I>() => ArrowChoice<$<IndexedF, [I]>>;

const indexedCojoined: <I>() => Conjoined<
  $<IndexedF, [I]>,
  $<Function1F, [I]>,
  TupleLeftF<I>
> = lazy(
  <I>(): Conjoined<$<IndexedF, [I]>, $<Function1F, [I]>, TupleLeftF<I>> => ({
    ...indexedArrowApply<I>(),
    ...indexedArrowChoice<I>(),
    ...indexedArrowLoop<I>(),
    ...indexedRepresentable<I>(),
    ...indexedCorepresentable<I>(),
    ...indexedClosed<I>(),
    F: { ...Distributive.Function1<I>(), ...Monad.Function1<I>() },
    C: { ...Traversable.Tuple2.left<I>(), ...Comonad.Tuple2.left<I>() },

    distrib:
      <F>(F: Functor<F>) =>
      <A, B>(pab: Indexed<I, A, B>) =>
      (fa: Kind<F, [A]>, i: I) =>
        F.map_(fa, a => pab(a, i)),
  }),
) as <I>() => Conjoined<$<IndexedF, [I]>, $<Function1F, [I]>, TupleLeftF<I>>;

Indexed.Profunctor = indexedProfunctor;
Indexed.Strong = indexedStrong;
Indexed.Costrong = indexedCostrong;
Indexed.Representable = indexedRepresentable;
Indexed.Corepresentable = indexedCorepresentable;
Indexed.Closed = indexedClosed;
Indexed.Arrow = indexedArrow;
Indexed.ArrowApply = indexedArrowApply;
Indexed.ArrowChoice = indexedArrowChoice;
Indexed.ArrowLoop = indexedArrowLoop;
Indexed.Cojoined = indexedCojoined;

// -- HKT

export interface IndexedF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Indexed<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
