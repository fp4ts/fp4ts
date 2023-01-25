// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Zip } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FunctorLaws } from './functor-laws';

export const ZipLaws = <F>(F: Zip<F>) => ({
  ...FunctorLaws(F),

  zipLeftIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.map_(F.zip_(fa, fa), ([a]) => a),
      fa,
    ),

  zipRightIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.map_(F.zip_(fa, fa), ([, a]) => a),
      fa,
    ),

  zipCommutativity: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ): IsEq<Kind<F, [[A, B]]>> =>
    new IsEq(
      F.zip_(fa, fb),
      F.map_(F.zip_(fb, fa), ([b, a]) => [a, b]),
    ),

  zipAssociativity: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    fc: Kind<F, [C]>,
  ): IsEq<Kind<F, [[[A, B], C]]>> =>
    new IsEq(
      F.zip_(F.zip_(fa, fb), fc),
      F.map_(F.zip_(fa, F.zip_(fb, fc)), ([a, [b, c]]) => [[a, b], c]),
    ),

  zipDistributes: <A, B, C, D>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A) => C,
    g: (b: B) => D,
  ): IsEq<Kind<F, [[C, D]]>> =>
    new IsEq(
      F.map_(F.zip_(fa, fb), ([a, b]) => [f(a), g(b)]),
      F.zip_(F.map_(fa, f), F.map_(fb, g)),
    ),

  zipWithConsistentWithZipMap: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ): IsEq<Kind<F, [C]>> =>
    new IsEq(
      F.zipWith_(fa, fb, f),
      F.map_(F.zip_(fa, fb), ([a, b]) => f(a, b)),
    ),

  zipWithFirstIsMap: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.zipWith_(fa, fa, (a, _) => f(a)),
      F.map_(fa, f),
    ),

  zipWithSecondIsMap: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.zipWith_(fa, fa, (_, a) => f(a)),
      F.map_(fa, f),
    ),
});
