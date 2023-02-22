// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind, pipe } from '@fp4ts/core';
import { Arrow, ArrowLoop } from '@fp4ts/cats-arrow';
import { Defer, Unzip, Zip } from '@fp4ts/cats-core';
import { CostrongLaws } from '@fp4ts/cats-profunctor-laws';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ArrowLaws } from './arrow-laws';

export const ArrowLoopLaws = <P>(P: ArrowLoop<P>) => ({
  ...ArrowLaws(P),
  ...CostrongLaws(P),

  arrowLoopExtension:
    <F>(F: Defer<F>) =>
    <A, B, C>(f: (afc: [A, Kind<F, [C]>]) => [B, Kind<F, [C]>]) =>
      new IsEq<Kind<P, [A, B]>>(
        P.loop_(F, P.lift(f)),
        P.lift((a: A) => {
          const bfc: [B, Kind<F, [C]>] = f([a, F.defer(() => bfc[1])]);
          return bfc[0];
        }),
      ),

  arrowLoopLeftTightening:
    <F>(F: Defer<F>) =>
    <A, B, C, D>(
      f: Kind<P, [A, B]>,
      g: Kind<P, [[B, Kind<F, [C]>], [D, Kind<F, [C]>]]>,
    ) =>
      new IsEq<Kind<P, [A, D]>>(
        P.loop_(F, P.andThen_(P.first<Kind<F, [C]>>()(f), g)),
        P.andThen_(f, P.loop_(F, g)),
      ),

  arrowLoopRightTightening:
    <F>(F: Defer<F>) =>
    <A, B, C, D>(
      f: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>,
      g: Kind<P, [B, D]>,
    ) =>
      new IsEq<Kind<P, [A, D]>>(
        P.loop_(F, P.andThen_(f, P.first<Kind<F, [C]>>()(g))),
        P.andThen_(P.loop_(F, f), g),
      ),

  arrowLoopSliding:
    <F>(F: Defer<F>) =>
    <A, B, C>(
      f: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>,
      g: (fc: Kind<F, [C]>) => Kind<F, [C]>,
    ) => {
      const split_ = Arrow.Function1.split_;
      return new IsEq<Kind<P, [A, B]>>(
        P.loop_(F, P.andThen_(f, P.lift(split_(id<B>, g)))),
        P.loop_(F, P.andThen_(P.lift(split_(id<A>, g)), f)),
      );
    },

  arrowLoopVanishing:
    <F>(F: Defer<F> & Unzip<F>) =>
    <A, B, C, D>(
      f: Kind<
        P,
        [[[A, Kind<F, [C]>], Kind<F, [D]>], [[B, Kind<F, [C]>], Kind<F, [D]>]]
      >,
    ) =>
      new IsEq<Kind<P, [A, B]>>(
        pipe(f, P.loop(F), P.loop(F)),
        pipe(
          P.lift(unassocF(F)<A, C, D>),
          P.andThen(f),
          P.andThen(P.lift(assocF(F))),
          P.loop(F),
        ),
      ),
});

const assocF =
  <F>(F: Zip<F>) =>
  <A, B, C>([[a, fb], fc]: [[A, Kind<F, [B]>], Kind<F, [C]>]): [
    A,
    Kind<F, [[B, C]]>,
  ] =>
    [a, F.zip_(fb, fc)];

const unassocF =
  <F>(F: Unzip<F>) =>
  <A, B, C>([a, fbc]: [A, Kind<F, [[B, C]]>]): [
    [A, Kind<F, [B]>],
    Kind<F, [C]>,
  ] => {
    const [fb, fc] = F.unzip(fbc);
    return [[a, fb], fc];
  };
