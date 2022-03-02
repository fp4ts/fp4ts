// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, fst, id, Kind, pipe } from '@fp4ts/core';
import { Arrow } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { CategoryLaws } from './category-laws';
import { StrongLaws } from './strong-laws';

export const ArrowLaws = <F>(F: Arrow<F>) => ({
  ...StrongLaws(F),
  ...CategoryLaws(F),

  arrowIdentity: <A>(): IsEq<Kind<F, [A, A]>> => new IsEq(F.lift(id), F.id()),

  arrowComposition: <A, B, C>(
    f: (a: A) => B,
    g: (b: B) => C,
  ): IsEq<Kind<F, [A, C]>> =>
    new IsEq(F.lift(flow(f, g)), F.andThen_(F.lift(f), F.lift(g))),

  arrowExtension: <A, B, C>(f: (a: A) => B): IsEq<Kind<F, [[A, C], [B, C]]>> =>
    new IsEq(pipe(F.lift(f), F.first), F.lift(split(id)(f))),

  arrowFunctor: <A, B, C, D>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [C, D]>,
  ): IsEq<Kind<F, [[A, D], [C, D]]>> =>
    new IsEq(
      F.first<A, C, D>(F.andThen_(f, g)),
      F.andThen_(F.first(f), F.first(g)),
    ),

  arrowExchange: <A, B, C, D>(
    f: Kind<F, [[A, B]]>,
    g: (c: C) => D,
  ): IsEq<Kind<F, [[A, C], [B, D]]>> =>
    new IsEq(
      pipe(F.first(f), F.andThen(F.lift(split(g)((b: B) => b)))),
      pipe(F.lift(split(g)((a: A) => a)), F.andThen(F.first(f))),
    ),

  arrowUnit: <A, B, C>(f: Kind<F, [[A, B]]>): IsEq<Kind<F, [[A, C], B]>> =>
    new IsEq(
      pipe(F.first<A, B, C>(f), F.andThen(F.lift(fst))),
      pipe(F.lift<[A, B], A>(fst), F.andThen(f)),
    ),

  arrowAssociation: <A, B, C, D>(
    f: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [[A, [C, D]], [B, [C, D]]]>> =>
    new IsEq(
      pipe(
        F.first(f),
        F.first,
        F.andThen(F.lift<[[B, C], D], [B, [C, D]]>(assoc)),
      ),
      pipe(F.lift<[[A, B], D], [A, [B, D]]>(assoc), F.andThen(F.first(f))),
    ),

  splitConsistentWithAndThen: <A, B, C, D>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [C, D]>,
  ): IsEq<Kind<F, [[A, C], [B, D]]>> =>
    new IsEq(F.split_(f, g), pipe(F.first(f), F.andThen(F.second(g)))),

  mergeConsistentWithAndThen: <A, B, C>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [A, C]>,
  ): IsEq<Kind<F, [A, [B, C]]>> =>
    new IsEq(
      F.merge_(f, g),
      pipe(
        F.lift((x: A) => [x, x] as const),
        F.andThen(F.split_(f, g)),
      ),
    ),
});

const split =
  <C, D>(g: (c: C) => D) =>
  <A, B>(f: (a: A) => B) =>
  ([a, c]: [A, C]): [B, D] =>
    [f(a), g(c)];

const assoc = <A, B, C>([[a, b], c]: [[A, B], C]): [A, [B, C]] => [a, [b, c]];
const unassoc = <A, B, C>([a, [b, c]]: [A, [B, C]]): [[A, B], C] => [[a, b], c];
