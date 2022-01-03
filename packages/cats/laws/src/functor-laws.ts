// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, id, Kind, pipe } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { InvariantLaws } from './invariant-laws';

export const FunctorLaws = <F>(F: Functor<F>): FunctorLaws<F> => ({
  ...InvariantLaws(F),

  covariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.map_(fa, id), fa),

  covariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => C,
  ): IsEq<Kind<F, [C]>> => {
    const lhs = pipe(fa, F.map(f), F.map(g));
    const rhs = F.map_(fa, compose(g, f));
    return new IsEq(lhs, rhs);
  },
});

export interface FunctorLaws<F> extends InvariantLaws<F> {
  covariantIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  covariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => C,
  ) => IsEq<Kind<F, [C]>>;
}
