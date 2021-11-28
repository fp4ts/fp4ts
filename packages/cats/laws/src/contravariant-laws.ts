// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, id, Kind, pipe } from '@fp4ts/core';
import { Contravariant } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { InvariantLaws } from './invariant-laws';

export const ContravariantLaws = <F>(
  F: Contravariant<F>,
): ContravariantLaws<F> => ({
  ...InvariantLaws(F),

  contravariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.contramap_(fa, id), fa),

  contravariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (b: B) => A,
    g: (c: C) => B,
  ): IsEq<Kind<F, [C]>> =>
    new IsEq(
      pipe(fa, F.contramap(f), F.contramap(g)),
      F.contramap_(fa, compose(f, g)),
    ),
});

export interface ContravariantLaws<F> extends InvariantLaws<F> {
  contravariantIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  contravariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (b: B) => A,
    g: (c: C) => B,
  ) => IsEq<Kind<F, [C]>>;
}
