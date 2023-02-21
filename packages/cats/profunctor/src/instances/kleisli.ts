// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, cached, F1, id, Kind } from '@fp4ts/core';
import { Applicative, Distributive, Functor, Monad } from '@fp4ts/cats-core';
import {
  Either,
  Kleisli,
  KleisliF,
  Left,
  Right,
} from '@fp4ts/cats-core/lib/data';
import { Choice, Cochoice } from '../choice';
import { Closed } from '../closed';
import { Profunctor } from '../profunctor';
import { Representable } from '../representable';
import { Sieve } from '../sieve';
import { Strong } from '../strong';
import { Traversing } from '../traversing';
import { Mapping } from '../mapping';

export const kleisliProfunctor = cached(
  <F>(F: Functor<F>): Profunctor<$<KleisliF, [F]>> =>
    Profunctor.of<$<KleisliF, [F]>>({
      dimap_: (pab, f, g) => F1.andThen(F1.compose(pab, f), F.map(g)),
      lmap_: (pab, f) => F1.compose(pab, f),
      rmap_: (pab, g) => F1.andThen(pab, F.map(g)),
    }),
);

export const kleisliStrong = cached(
  <F>(F: Functor<F>): Strong<$<KleisliF, [F]>> =>
    Strong.of<$<KleisliF, [F]>>({
      ...kleisliProfunctor(F),

      first:
        <C>() =>
        <A, B>(pab: Kleisli<F, A, B>) =>
        ([a, c]: [A, C]) =>
          F.map_(pab(a), b => [b, c]),

      second:
        <C>() =>
        <A, B>(pab: Kleisli<F, A, B>) =>
        ([c, a]: [C, A]) =>
          F.map_(pab(a), b => [c, b]),
    }),
);

export const kleisliChoice = cached(
  <F>(F: Applicative<F>): Choice<$<KleisliF, [F]>> =>
    Choice.of<$<KleisliF, [F]>>({
      ...kleisliProfunctor(F),

      left:
        <C>() =>
        <A, B>(pab: Kleisli<F, A, B>) =>
        (ac: Either<A, C>): Kind<F, [Either<B, C>]> =>
          ac.isLeft ? F.map_(pab(ac.getLeft), Left) : F.pure(ac as any),

      right:
        <C>() =>
        <A, B>(pab: Kleisli<F, A, B>) =>
        (ca: Either<C, A>): Kind<F, [Either<C, B>]> =>
          ca.isRight ? F.map_(pab(ca.get), Right) : F.pure(ca as any),
    }),
);

export const kleisliCochoice = cached(
  <F>(F: Functor<F>): Cochoice<$<KleisliF, [F]>> =>
    Cochoice.of<$<KleisliF, [F]>>({
      ...kleisliProfunctor(F),

      unleft: <A, B, C>(
        pab: Kleisli<F, Either<A, C>, Either<B, C>>,
      ): Kleisli<F, A, B> =>
        F1.andThen(
          F1.compose(pab, Left),
          F.map(ea => ea.getLeft),
        ),

      unright: <A, B, C>(
        pab: Kleisli<F, Either<C, A>, Either<C, B>>,
      ): Kleisli<F, A, B> =>
        F1.andThen(
          F1.compose(pab, Right),
          F.map(ea => ea.get),
        ),
    }),
);

export const kleisliTraversing = cached(
  <F>(F: Applicative<F>): Traversing<$<KleisliF, [F]>> =>
    Traversing.of<$<KleisliF, [F]>>({
      ...kleisliStrong(F),
      ...kleisliChoice(F),

      traverse_: (G, pab) => G.traverse(F)(pab),
      wander_: (pab, f) => f(F)(pab),
    }),
);

export const kleisliClosed = cached(
  <F>(F: Distributive<F>): Closed<$<KleisliF, [F]>> =>
    Closed.of<$<KleisliF, [F]>>({
      ...kleisliProfunctor(F),
      closed:
        <X>() =>
        <A, B>(pab: Kleisli<F, A, B>) =>
        (xa: (x: X) => A) =>
          F.consequence(Monad.Function1<X>())(F1.compose(pab, xa)),
    }),
);

export const kleisliSieve = cached(
  <F>(F: Functor<F>): Sieve<$<KleisliF, [F]>, F> =>
    Sieve.of<$<KleisliF, [F]>, F>({
      ...kleisliProfunctor(F),
      F,
      sieve: id,
    }),
);

export const kleisliRepresentable = cached(
  <F>(F: Functor<F>): Representable<$<KleisliF, [F]>, F> =>
    Representable.of<$<KleisliF, [F]>, F>({
      ...kleisliSieve(F),
      ...kleisliStrong(F),

      tabulate: id,
    }),
);

export const kleisliMapping = cached(
  <F>(F: Applicative<F> & Distributive<F>): Mapping<$<KleisliF, [F]>> =>
    Mapping.of<$<KleisliF, [F]>>({
      ...kleisliTraversing(F),
      ...kleisliClosed(F),

      roam_:
        <S, T, A, B>(
          pab: Kleisli<F, A, B>,
          f: (g: (a: A) => B) => (s: S) => T,
        ): Kleisli<F, S, T> =>
        (s: S) =>
          F.map_(F.consequence(Monad.Function1<A>())(pab), g => f(g)(s)),
    }),
);
