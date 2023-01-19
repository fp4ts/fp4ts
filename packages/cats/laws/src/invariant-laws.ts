// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, id, Kind, pipe } from '@fp4ts/core';
import { Invariant } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const InvariantLaws = <F>(F: Invariant<F>): InvariantLaws<F> => ({
  invariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.imap_(fa, id, id), fa),

  invariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f1: (a: A) => B,
    g1: (b: B) => C,
    f2: (b: B) => A,
    g2: (c: C) => B,
  ): IsEq<Kind<F, [C]>> =>
    new IsEq(
      pipe(fa, F.imap(f1, f2), F.imap(g1, g2)),
      F.imap_(fa, compose(g1, f1), compose(f2, g2)),
    ),
});

export interface InvariantLaws<F> {
  invariantIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  invariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f1: (a: A) => B,
    g1: (b: B) => C,
    f2: (b: B) => A,
    g2: (c: C) => B,
  ) => IsEq<Kind<F, [C]>>;
}
