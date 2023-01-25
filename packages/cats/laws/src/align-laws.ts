// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Align } from '@fp4ts/cats-core';
import { Ior } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

export const AlignLaws = <F>(F: Align<F>): AlignLaws<F> => ({
  alignAssociativity: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    fc: Kind<F, [C]>,
  ): IsEq<Kind<F, [Ior<Ior<A, B>, C>]>> =>
    new IsEq(
      F.align_(F.align_(fa, fb), fc),
      F.map_(F.align_(fa, F.align_(fb, fc)), assoc),
    ),

  alignHomomorphism: <A, B, C, D>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A) => C,
    g: (c: B) => D,
  ): IsEq<Kind<F, [Ior<C, D>]>> =>
    new IsEq(
      F.align_(F.map_(fa, f), F.map_(fb, g)),
      F.map_(F.align_(fa, fb), ior => ior.bimap(f, g)),
    ),

  alignWithConsistent: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (ior: Ior<A, B>) => C,
  ): IsEq<Kind<F, [C]>> =>
    new IsEq(F.alignWith_(fa, fb, f), F.map_(F.align_(fa, fb), f)),
});

const assoc = <A, B, C>(ior: Ior<A, Ior<B, C>>): Ior<Ior<A, B>, C> =>
  ior.fold(
    a => Ior.Left(Ior.Left(a)),
    bc =>
      bc.fold(
        b => Ior.Left(Ior.Right(b)),
        c => Ior.Right(c),
        (b, c) => Ior.Both(Ior.Right(b), c),
      ),
    (a, bc) =>
      bc.fold(
        b => Ior.Left(Ior.Both(a, b)),
        c => Ior.Both(Ior.Left(a), c),
        (b, c) => Ior.Both(Ior.Both(a, b), c),
      ),
  );

export interface AlignLaws<F> {
  alignAssociativity: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    fc: Kind<F, [C]>,
  ) => IsEq<Kind<F, [Ior<Ior<A, B>, C>]>>;

  alignHomomorphism: <A, B, C, D>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A) => C,
    g: (c: B) => D,
  ) => IsEq<Kind<F, [Ior<C, D>]>>;

  alignWithConsistent: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (ior: Ior<A, B>) => C,
  ) => IsEq<Kind<F, [C]>>;
}
