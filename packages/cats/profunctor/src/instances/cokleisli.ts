// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, cached, F1, id, Kind } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats-core';
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

    unfirst:
      <A, B, C>(pab: Cokleisli<F, [A, C], [B, C]>) =>
      (fa: Kind<F, [A]>) =>
        pab(F.map_(fa, a => [a, undefined as any]))[0],

    unsecond:
      <A, B, C>(pab: Cokleisli<F, [C, A], [C, B]>) =>
      (fa: Kind<F, [A]>) =>
        pab(F.map_(fa, a => [undefined as any, a]))[1],
  }),
);

export const cokleisliCochoice = cached(<F>(F: Functor<F>) =>
  Cochoice.of<$<CokleisliF, [F]>>({
    ...cokleisliProfunctor(F),

    unleft:
      <A, B, C>(pab: Cokleisli<F, Either<A, C>, Either<B, C>>) =>
      (fa: Kind<F, [A]>) =>
        pab(F.map_(fa, Left)).getLeft,

    unright:
      <A, B, C>(pab: Cokleisli<F, Either<C, A>, Either<C, B>>) =>
      (fa: Kind<F, [A]>) =>
        pab(F.map_(fa, Right)).get,
  }),
);

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
