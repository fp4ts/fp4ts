/* eslint-disable prettier/prettier */
// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { F1, fst, id, Kind, pipe, tupled } from '@fp4ts/core';
import { Arrow } from '@fp4ts/cats-arrow';
import { StrongLaws } from '@fp4ts/cats-profunctor-laws';
import { IsEq } from '@fp4ts/cats-test-kit';
import { CategoryLaws } from './category-laws';

export const ArrowLaws = <P>(P: Arrow<P>) => ({
  ...StrongLaws(P),
  ...CategoryLaws(P),

  arrowIdentity:
    <A>() =>
    (): IsEq<Kind<P, [A, A]>> =>
      new IsEq(P.lift(id), P.id()),

  arrowComposition: <A, B, C>(
    f: (a: A) => B,
    g: (b: B) => C,
  ): IsEq<Kind<P, [A, C]>> =>
    new IsEq(P.lift(F1.andThen(f, g)), P.andThen_(P.lift(f), P.lift(g))),

  arrowExtension:
    <C>() =>
    <A, B>(f: (a: A) => B): IsEq<Kind<P, [[A, C], [B, C]]>> => {
      const first = Arrow.Function1.first;
      return new IsEq(P.first<C>()(P.lift(f)), P.lift(first<C>()(f)));
    },

  arrowFunctor:
    <D>() =>
    <A, B, C>(f: Kind<P, [A, B]>, g: Kind<P, [B, C]>) =>
      new IsEq<Kind<P, [[A, D], [C, D]]>>(
        P.first<D>()(P.andThen_(f, g)),
        P.andThen_(P.first<D>()(f), P.first<D>()(g)),
      ),

  arrowUnit:
    <C>() =>
    <A, B>(f: Kind<P, [A, B]>) =>
      new IsEq<Kind<P, [[A, C], B]>>(
        P.andThen_(P.first<C>()(f), P.lift(fst)),
        P.andThen_(P.lift(([a, ]: [A, C]) => a), f),
      ),

  arrowExchange: <A, B, C, D>(f: Kind<P, [A, B]>, g: (c: C) => D) => {
    const split = Arrow.Function1.split_;
    return new IsEq<Kind<P, [[A, C], [B, D]]>>(
      P.andThen_(P.first<C>()(f), P.lift(split(id<B>, g))),
      P.andThen_(P.lift(split(id<A>, g)), P.first<D>()(f)),
    );
  },

  arrowAssociation:
    <C, D>() =>
    <A, B>(f: Kind<P, [A, B]>) =>
      new IsEq<Kind<P, [[[A, C], D], [B, [C, D]]]>>(
        pipe(f, P.first<C>(), P.first<D>(), P.andThen(P.lift((assoc)<B, C, D>))),
        pipe(P.lift((assoc)<A, C, D>), P.andThen(P.first<[C, D]>()(f))),
      ),

  arrowSplitConsistentWithAndThen: <A, B, C, D>(
    f: Kind<P, [A, B]>,
    g: Kind<P, [C, D]>,
  ) =>
    new IsEq<Kind<P, [[A, C], [B, D]]>>(
      P.split_(f, g),
      P.andThen_(P.first<C>()(f), P.second<B>()(g)),
    ),

  arrowMergeConsistentWithAndThen: <A, B, C>(
    f: Kind<P, [A, B]>,
    g: Kind<P, [A, C]>,
  ) =>
    new IsEq<Kind<P, [A, [B, C]]>>(
      P.merge_(f, g),
      P.andThen_(P.lift((x: A) => tupled(x, x)), P.split_(f, g)),
    )
});

const assoc = <A, B, C>([[a, b], c]: [[A, B], C]): [A, [B, C]] => [a, [b, c]];
