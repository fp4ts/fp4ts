// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  curry,
  id,
  lazy,
  tuple,
  TyK,
  TyVar,
  uncurry,
  untuple,
  instance,
  Kind,
} from '@fp4ts/core';
import {
  Either,
  Left,
  Right,
  Function1F,
  TupleLeftF,
  Monad,
  Distributive,
  Bifunctor,
  Comonad,
  Traversable,
  Defer,
} from '@fp4ts/cats';

import { IndexedPLens, PLens } from '../lens';
import { IndexedPTraversal, PTraversal } from '../traversal';
import { IndexedPSetter } from '../setter';
import { IndexedGetter, Getter } from '../getter';
import { IndexedFold, Fold } from '../fold';
import { AnyIndexedOptical } from '../optics';
import { Indexable } from './indexable';
import { Indexing } from './indexing';
import {
  Closed,
  Corepresentable,
  Costrong,
  Profunctor,
  Representable,
  Strong,
} from '@fp4ts/cats-profunctor';
import { Conjoined } from '@fp4ts/optics-kernel';
import { Arrow, ArrowApply, ArrowChoice, ArrowLoop } from '@fp4ts/cats-arrow';

export type Indexed<I, A, B> = (a: A, i: I) => B;

export const Indexed: IndexedObj = function () {};

interface IndexedObj {
  Profunctor<I>(): Profunctor<$<IndexedF, [I]>>;
  Strong<I>(): Strong<$<IndexedF, [I]>>;
  Costrong<I>(): Costrong<$<IndexedF, [I]>>;
  Representable<I>(): Representable<$<IndexedF, [I]>, $<Function1F, [I]>>;
  Corepresentable<I>(): Corepresentable<$<IndexedF, [I]>, TupleLeftF<I>>;
  Closed<I>(): Closed<$<IndexedF, [I]>>;
  Arrow<I>(): Arrow<$<IndexedF, [I]>>;
  ArrowApply<I>(): ArrowApply<$<IndexedF, [I]>>;
  ArrowChoice<I>(): ArrowChoice<$<IndexedF, [I]>>;
  ArrowLoop<I>(): ArrowLoop<$<IndexedF, [I]>>;
  Cojoined<I>(): Conjoined<$<IndexedF, [I]>, $<Function1F, [I]>, TupleLeftF<I>>;
}

// -- Optics functions

export function reindex<I, J>(f: (i: I) => J) {
  /* eslint-disable prettier/prettier */
  function impl<S, T, A, B>(l: IndexedPTraversal<I, S, T, A, B>): IndexedPTraversal<J, S, T, A, B>;
  function impl<S, T, A, B>(l: IndexedPSetter<I, S, T, A, B>): IndexedPSetter<J, S, T, A, B>;
  function impl<S, A>(l: IndexedGetter<I, S, A>): IndexedGetter<J, S, A>;
  function impl<S, A>(l: IndexedFold<I, S, A>): IndexedFold<J, S, A>;
  function impl<S, T, A, B>(l: AnyIndexedOptical<I, S, T, A, B>): AnyIndexedOptical<J, S, T, A, B>;
  function impl<S, T, A, B>(l: AnyIndexedOptical<I, S, T, A, B>): AnyIndexedOptical<J, S, T, A, B> {
    return (F, P, Q) => h => l(F, Indexable.Indexed(), Q)((a, i) => h(a, f(i)));
  }
  /* eslint-enable prettier/prettier */
  return impl;
}

/* eslint-disable prettier/prettier */
export function indexed<S, T, A, B>(l: PLens<S, T, A, B>): IndexedPLens<number, S, T, A, B>;
export function indexed<S, T, A, B>(l: PTraversal<S, T, A, B>): IndexedPTraversal<number, S, T, A, B>;
export function indexed<S, A>(l: Getter<S, A>): IndexedGetter<number, S, A>;
export function indexed<S, A>(l: Fold<S, A>): IndexedFold<number, S, A>;
export function indexed<S, A>(l: Fold<S, A>): IndexedFold<number, S, A> {
  /* eslint-enable prettier/prettier */
  return (F, P, Q) => pafb => s =>
    l(
      {
        ...Indexing.Applicative(F),
        ...Indexing.Contravariant(F),
        ...Indexing.Functor(F),
      },
      Indexable.Function1(),
      Q,
    )(a => i => [i + 1, P.indexed(pafb)(a, i)])(s)(0)[1];
}

// -- Instances

const indexedProfunctor: <I>() => Profunctor<$<IndexedF, [I]>> = lazy(<I>() =>
  Profunctor.of<$<IndexedF, [I]>>({
    dimap_:
      <A, B, C, D>(
        ab: Indexed<I, A, B>,
        f: (c: C) => A,
        g: (b: B) => D,
      ): Indexed<I, C, D> =>
      (c: C, i: I) =>
        g(ab(f(c), i)),
  }),
) as <I>() => Profunctor<$<IndexedF, [I]>>;

const indexedStrong: <I>() => Strong<$<IndexedF, [I]>> = lazy(<I>() =>
  Strong.of<$<IndexedF, [I]>>({
    ...indexedProfunctor<I>(),
    first:
      <C>() =>
      <A, B>(ab: Indexed<I, A, B>): Indexed<I, [A, C], [B, C]> =>
      ([a, c], i) =>
        [ab(a, i), c],

    second:
      <C>() =>
      <A, B>(ab: Indexed<I, A, B>): Indexed<I, [C, A], [C, B]> =>
      ([c, a], i) =>
        [c, ab(a, i)],
  }),
) as <I>() => Strong<$<IndexedF, [I]>>;

const indexedCostrong: <I>() => Costrong<$<IndexedF, [I]>> = lazy(<I>() =>
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

const indexedRepresentable: <I>() => Representable<
  $<IndexedF, [I]>,
  $<Function1F, [I]>
> = lazy(<I>() =>
  Representable.of<$<IndexedF, [I]>, $<Function1F, [I]>>({
    ...indexedStrong<I>(),
    F: Monad.Function1<I>(),
    sieve: curry,
    tabulate: uncurry,
  }),
) as <I>() => Representable<$<IndexedF, [I]>, $<Function1F, [I]>>;

const indexedCorepresentable: <I>() => Corepresentable<
  $<IndexedF, [I]>,
  TupleLeftF<I>
> = lazy(<I>() =>
  Corepresentable.of<$<IndexedF, [I]>, TupleLeftF<I>>({
    ...indexedCostrong<I>(),
    C: Bifunctor.Tuple2.leftFunctor<I>(),
    cosieve: tuple,
    cotabulate: untuple,
  }),
) as <I>() => Corepresentable<$<IndexedF, [I]>, TupleLeftF<I>>;

const indexedClosed: <I>() => Closed<$<IndexedF, [I]>> = lazy(<I>() =>
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

const indexedArrow: <I>() => Arrow<$<IndexedF, [I]>> = lazy(
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

const indexedArrowLoop: <I>() => ArrowLoop<$<IndexedF, [I]>> = lazy(
  <I>(): ArrowLoop<$<IndexedF, [I]>> =>
    ArrowLoop.of({
      ...indexedArrow<I>(),
      ...indexedCostrong<I>(),
    }),
) as <I>() => ArrowLoop<$<IndexedF, [I]>>;

const indexedArrowApply: <I>() => ArrowApply<$<IndexedF, [I]>> = lazy(
  <I>(): ArrowApply<$<IndexedF, [I]>> =>
    ArrowApply.of({
      ...indexedArrow<I>(),

      app:
        <A, B>() =>
        ([fab, a]: [Indexed<I, A, B>, A], i: I) =>
          fab(a, i),
    }),
) as <I>() => ArrowApply<$<IndexedF, [I]>>;

const indexedArrowChoice: <I>() => ArrowChoice<$<IndexedF, [I]>> = lazy(
  <I>(): ArrowChoice<$<IndexedF, [I]>> =>
    ArrowChoice.of({
      ...indexedArrow<I>(),

      choose_:
        <A, B, C, D>(
          f: Indexed<I, A, C>,
          g: Indexed<I, B, D>,
        ): Indexed<I, Either<A, B>, Either<C, D>> =>
        (ab, i) =>
          ab.fold(
            a => Left(f(a, i)),
            b => Right(g(b, i)),
          ),
    }),
) as <I>() => ArrowChoice<$<IndexedF, [I]>>;

const indexedCojoined: <I>() => Conjoined<
  $<IndexedF, [I]>,
  $<Function1F, [I]>,
  TupleLeftF<I>
> = lazy(<I>() =>
  instance<Conjoined<$<IndexedF, [I]>, $<Function1F, [I]>, TupleLeftF<I>>>({
    ...Indexed.ArrowApply<I>(),
    ...Indexed.ArrowChoice<I>(),
    ...Indexed.ArrowLoop<I>(),
    ...Indexed.Representable<I>(),
    ...Indexed.Corepresentable<I>(),
    ...Indexed.Closed<I>(),
    F: { ...Distributive.Function1<I>(), ...Monad.Function1<I>() },
    C: { ...Traversable.Tuple2.left<I>(), ...Comonad.Tuple2.left<I>() },
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
