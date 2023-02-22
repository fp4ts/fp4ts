// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, cached, Eval, F1, id, Kind } from '@fp4ts/core';
import { Applicative, Defer, Functor } from '@fp4ts/cats-core';
import {
  Cokleisli,
  CokleisliF,
  Either,
  Left,
  Right,
} from '@fp4ts/cats-core/lib/data';
import { Profunctor } from '../profunctor';
import { Costrong } from '../strong';
import { Cochoice } from '../choice';
import { Cosieve } from '../sieve';
import { Corepresentable } from '../representable';
import { Closed } from '../closed';

export const cokleisliProfunctor = cached(
  <F>(F: Functor<F>): Profunctor<$<CokleisliF, [F]>> =>
    Profunctor.of<$<CokleisliF, [F]>>({
      dimap_: (pab, f, g) => F1.andThen(F1.compose(pab, F.map(f)), g),
      lmap_: (pab, f) => F1.compose(pab, F.map(f)),
      rmap_: (pab, g) => F1.andThen(pab, g),
    }),
);

export const cokleisliCostrong = cached(<F>(F: Functor<F>) =>
  Costrong.of<$<CokleisliF, [F]>>({
    ...cokleisliProfunctor(F),

    unfirst_:
      <G, A, B, C>(
        G: Defer<G>,
        pab: Cokleisli<F, [A, Kind<G, [C]>], [B, Kind<G, [C]>]>,
      ) =>
      (fa: Kind<F, [A]>) => {
        const bgc: [B, Kind<G, [C]>] = pab(
          F.map_(fa, a => [a, G.defer(() => bgc[1])]),
        );
        return bgc[0];
      },

    unsecond_:
      <G, A, B, C>(
        G: Defer<G>,
        pab: Cokleisli<F, [Kind<G, [C]>, A], [Kind<G, [C]>, B]>,
      ) =>
      (fa: Kind<F, [A]>) => {
        const gcb: [Kind<G, [C]>, B] = pab(
          F.map_(fa, a => [G.defer(() => gcb[0]), a]),
        );
        return gcb[1];
      },
  }),
);

export const cokleisliCochoice = cached(<F>(F: Applicative<F>) => {
  const goUnleft = <A, B, C>(
    pab: Cokleisli<F, Either<A, C>, Either<B, C>>,
    fac: Kind<F, [Either<A, C>]>,
  ): Eval<B> => {
    const bc = pab(fac);
    return bc.isLeft
      ? Eval.now(bc.getLeft)
      : Eval.defer(() => goUnleft(pab, F.pure(bc as any as Either<A, C>)));
  };

  const goUnright = <A, B, C>(
    pab: Cokleisli<F, Either<C, A>, Either<C, B>>,
    fca: Kind<F, [Either<C, A>]>,
  ): Eval<B> => {
    const cb = pab(fca);
    return cb.isRight
      ? Eval.now(cb.get)
      : Eval.defer(() => goUnright(pab, F.pure(cb as any as Either<C, A>)));
  };

  return Cochoice.of<$<CokleisliF, [F]>>({
    ...cokleisliProfunctor(F),

    unleft:
      <A, B, C>(pab: Cokleisli<F, Either<A, C>, Either<B, C>>) =>
      (fa: Kind<F, [A]>) =>
        goUnleft(pab, F.map_(fa, Left)).value,

    unright:
      <A, B, C>(pab: Cokleisli<F, Either<C, A>, Either<C, B>>) =>
      (fa: Kind<F, [A]>) =>
        goUnright(pab, F.map_(fa, Right)).value,
  });
});

export const cokleisliCosieve = cached(
  <F>(F: Functor<F>): Cosieve<$<CokleisliF, [F]>, F> =>
    Cosieve.of<$<CokleisliF, [F]>, F>({
      ...cokleisliProfunctor(F),
      C: F,
      cosieve: id,
    }),
);

export const cokleisliCorepresentable = cached(
  <F>(F: Functor<F>): Corepresentable<$<CokleisliF, [F]>, F> =>
    Corepresentable.of<$<CokleisliF, [F]>, F>({
      ...cokleisliCosieve(F),
      ...cokleisliCostrong(F),

      cotabulate: id,
    }),
);

export const cokleisliClosed = cached(
  <F>(F: Functor<F>): Closed<$<CokleisliF, [F]>> =>
    Closed.of<$<CokleisliF, [F]>>({
      ...cokleisliProfunctor(F),

      closed:
        <X>() =>
        <A, B>(pab: Cokleisli<F, A, B>) =>
        (fxa: Kind<F, [(x: X) => A]>) =>
        (x: X) =>
          pab(F.map_(fxa, xa => xa(x))),
    }),
);
