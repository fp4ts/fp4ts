// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Local } from '@fp4ts/mtl-core';
import { AskLaws } from './ask-laws';

export const LocalLaws = <F, R>(F: Local<F, R>) => ({
  ...AskLaws(F),

  askReflectsLocal: (f: (r: R) => R): IsEq<Kind<F, [R]>> =>
    new IsEq(F.local_(F.ask(), f), F.map_(F.ask(), f)),

  localPureIsPure: <A>(a: A, f: (r: R) => R): IsEq<Kind<F, [A]>> =>
    new IsEq(F.local_(F.pure(a), f), F.pure(a)),

  localDistributesOverAp: <A, B>(
    fa: Kind<F, [A]>,
    ff: Kind<F, [(a: A) => B]>,
    f: (r: R) => R,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.local_(F.ap_(ff, fa), f),
      F.ap_(F.local_(ff, f), F.local_(fa, f)),
    ),

  scopeIsLocalConst: <A>(fa: Kind<F, [A]>, r: R): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.scope_(fa, r),
      F.local_(fa, () => r),
    ),
});
