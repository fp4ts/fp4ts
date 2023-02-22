// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ArrowApply } from '@fp4ts/cats-arrow';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Kind, pipe, tupled } from '@fp4ts/core';
import { ArrowLaws } from './arrow-laws';

export const ArrowApplyLaws = <P>(P: ArrowApply<P>) => ({
  ...ArrowLaws(P),

  arrowApplyFirstLiftAppIdentity:
    <A, B>() =>
    () =>
      new IsEq<Kind<P, [[A, B], [A, B]]>>(
        pipe(
          P.lift((a: A) => P.lift((b: B) => tupled(a, b))),
          P.first<B>(),
          P.andThen(P.app()),
        ),
        P.id<[A, B]>(),
      ),

  arrowApplyLeftComposeAppEquivalence:
    <C>() =>
    <A, B>(f: Kind<P, [A, B]>) =>
      new IsEq<Kind<P, [[Kind<P, [B, C]>, A], C]>>(
        pipe(P.lift(P.compose(f)<C>), P.first<A>(), P.andThen(P.app())),
        pipe(f, P.second<Kind<P, [B, C]>>(), P.andThen(P.app())),
      ),

  arrowApplyRightComposeAppEquivalence:
    <C>() =>
    <A, B>(g: Kind<P, [A, B]>) =>
      new IsEq(
        pipe(
          P.lift((f: Kind<P, [C, A]>) => P.andThen_(f, g)),
          P.first<C>(),
          P.andThen(P.app()),
        ),
        P.andThen_(P.app<C, A>(), g),
      ),
});
