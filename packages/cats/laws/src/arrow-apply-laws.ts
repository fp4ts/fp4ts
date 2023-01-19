// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe, tupled } from '@fp4ts/core';
import { ArrowApply } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ArrowLaws } from './arrow-laws';

export const ArrowApplyLaws = <F>(F: ArrowApply<F>) => ({
  ...ArrowLaws(F),

  firstLiftAppIdentity:
    <A, B>() =>
    (): IsEq<Kind<F, [[A, B], [A, B]]>> =>
      new IsEq(
        pipe(
          F.lift((a: A) => F.lift((b: B) => tupled(a, b))),
          F.first<B>(),
          F.andThen(F.app()),
        ),
        F.id<[A, B]>(),
      ),

  leftComposeAppEquivalence:
    <C>() =>
    <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [[Kind<F, [B, C]>, A], C]>> =>
      new IsEq(
        pipe(
          F.lift((fbc: Kind<F, [B, C]>) => F.andThen_(fab, fbc)),
          F.first<A>(),
          F.andThen(F.app()),
        ),
        pipe(fab, F.second<Kind<F, [B, C]>>(), F.andThen(F.app())),
      ),

  rightComposeAppEquivalence:
    <C>() =>
    <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [[Kind<F, [C, A]>, C], B]>> =>
      new IsEq(
        pipe(
          F.lift((fca: Kind<F, [C, A]>) => F.andThen_(fca, fab)),
          F.first<C>(),
          F.andThen(F.app()),
        ),
        F.andThen_(F.app<C, A>(), fab),
      ),

  arrowApplyDoIsComposition: <A, B, C>(
    fab: Kind<F, [A, B]>,
    fbc: Kind<F, [B, C]>,
  ): IsEq<Kind<F, [A, C]>> =>
    new IsEq(
      F.proc((a: A) =>
        F.do(function* (_) {
          const b = yield* _(fab, a);
          const c = yield* _(fbc, b);
          return c;
        }),
      ),
      F.andThen_(fab, fbc),
    ),

  arrowApplyDoIsFirstLiftComposition: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
    fac: Kind<F, [A, C]>,
    f: (b: B, c: C) => D,
  ): IsEq<Kind<F, [A, D]>> =>
    new IsEq(
      F.proc((a: A) =>
        F.do(function* (_) {
          const b = yield* _(fab, a);
          const c = yield* _(fac, a);
          return f(b, c);
        }),
      ),
      pipe(
        F.lift((a: A) => tupled(a, a)),
        F.andThen(F.first<A>()(fab)),
        F.andThen(F.lift(([b, a]) => tupled(a, b))),
        F.andThen(F.first<B>()(fac)),
        F.andThen(F.lift(([c, b]) => f(b, c))),
      ),
    ),
});
