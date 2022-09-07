// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { CoflatMap } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FunctorLaws } from './functor-laws';
import { Cokleisli } from '@fp4ts/cats-core/lib/data';

export const CoflatMapLaws = <F>(F: CoflatMap<F>) => ({
  ...FunctorLaws(F),

  coflatMapAssociativity: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (fa: Kind<F, [A]>) => B,
    g: (fa: Kind<F, [B]>) => C,
  ): IsEq<Kind<F, [C]>> =>
    new IsEq(
      pipe(fa, F.coflatMap(f), F.coflatMap(g)),
      F.coflatMap_(fa, x => g(F.coflatMap_(x, f))),
    ),

  coflattenThroughMap: <A>(fa: Kind<F, [A]>): IsEq<Kind<[F, F, F], [A]>> =>
    new IsEq(
      pipe(fa, F.coflatten, F.coflatten),
      pipe(fa, F.coflatten, F.map(F.coflatten)),
    ),

  coflattenCoherence: <A, B>(
    fa: Kind<F, [A]>,
    f: (fa: Kind<F, [A]>) => B,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(F.coflatMap_(fa, f), pipe(fa, F.coflatten, F.map(f))),

  cokleisliAssociativity: <A, B, C, D>(
    fa: Kind<F, [A]>,
    f: (fa: Kind<F, [A]>) => B,
    g: (fb: Kind<F, [B]>) => C,
    h: (fc: Kind<F, [C]>) => D,
  ): IsEq<D> => {
    const C = Cokleisli.Compose(F);

    const l = C.andThen_(C.andThen_(f, g), h)(fa);
    const r = C.andThen_(f, C.andThen_(g, h))(fa);

    return new IsEq(l, r);
  },
});
