// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, cached, Eval, F1, fst, id, Kind, snd } from '@fp4ts/core';
import {
  Applicative,
  Comonad,
  Defer,
  Distributive,
  Functor,
  Monad,
  MonadDefer,
  Traversable,
} from '@fp4ts/cats-core';
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
import { Costrong, Strong } from '../strong';
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

export const kleisliCostrong = cached(
  <F>(F: MonadDefer<F> & Comonad<F>): Costrong<$<KleisliF, [F]>> =>
    Costrong.of<$<KleisliF, [F]>>({
      ...kleisliProfunctor(F),

      unfirst_:
        <G, A, B, C>(
          G: Defer<G>,
          f: Kleisli<F, [A, Kind<G, [C]>], [B, Kind<G, [C]>]>,
        ) =>
        (a: A) =>
          F.map_(
            F.fix<[B, Kind<G, [C]>]>(fbgc =>
              f([a, G.defer(() => F.extract(fbgc)[1])]),
            ),
            fst,
          ),

      unsecond_:
        <G, A, B, C>(
          G: Defer<G>,
          f: Kleisli<F, [Kind<G, [C]>, A], [Kind<G, [C]>, B]>,
        ) =>
        (a: A) =>
          F.map_(
            F.fix<[Kind<G, [C]>, B]>(fgcb =>
              f([G.defer(() => F.extract(fgcb)[0]), a]),
            ),
            snd,
          ),
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
  <F>(F: Traversable<F>): Cochoice<$<KleisliF, [F]>> => {
    const _sequence = F.sequence(Either.Monad<any>());
    const sequence: <C, B>(
      fga: Kind<F, [Either<C, B>]>,
    ) => Either<C, Kind<F, [B]>> = _sequence;

    const goUnright = <A, B, C>(
      pab: Kleisli<F, Either<C, A>, Either<C, B>>,
      ac: Either<C, A>,
    ): Eval<Kind<F, [B]>> => {
      const fcb = pab(ac);
      const cfb = sequence(fcb);
      return cfb.isLeft
        ? Eval.defer(() => goUnright(pab, cfb as any as Either<C, A>))
        : Eval.now(cfb.get);
    };

    return Cochoice.of<$<KleisliF, [F]>>({
      ...kleisliProfunctor(F),

      unright:
        <A, B, C>(pab: Kleisli<F, Either<C, A>, Either<C, B>>) =>
        (a: A) =>
          goUnright(pab, Right(a)).value,
    });
  },
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
