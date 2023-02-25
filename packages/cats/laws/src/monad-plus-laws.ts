// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { MonadPlus } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { AlternativeLaws } from './alternative-laws';
import { FunctorFilterLaws } from './functor-filter-laws';
import { MonadLaws } from './monad-laws';

export const MonadPlusLaws = <F>(F: MonadPlus<F>) => ({
  ...AlternativeLaws(F),
  ...MonadLaws(F),
  ...FunctorFilterLaws(F),

  monadPlusFilterFalseIsEmpty: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.filter_(fa, _ => false),
      F.emptyK(),
    ),

  monadPlusFilterTrueIsIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.filter_(fa, _ => true),
      fa,
    ),

  monadPlusFilterReference: <A>(
    fa: Kind<F, [A]>,
    f: (a: A) => boolean,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.filter_(fa, f),
      F.flatMap_(fa, a => (f(a) ? F.pure(a) : F.emptyK())),
    ),
});
