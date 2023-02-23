// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ArrowApply, FlatMap, Monad, MonadDefer } from '@fp4ts/cats-core';
import {
  Either,
  Kleisli,
  KleisliF,
  Left,
  Right,
} from '@fp4ts/cats-core/lib/data';
import { Choice, Costrong, Strong } from '@fp4ts/cats-profunctor';
import { $, cached, F1, Kind, lazy } from '@fp4ts/core';
import { ArrowChoice } from '../arrow-choice';
import { Arrow } from '../arrow';
import { Compose } from '../compose';
import { Category } from '../category';
import { ArrowLoop } from '../arrow-loop';

export const kleisliCompose = cached(
  <F>(F: FlatMap<F>): Compose<$<KleisliF, [F]>> =>
    Compose.of({
      andThen_: F.andThen_,
      compose_: F.compose_,
    }),
);

export const kleisliCategory = cached(
  <F>(F: Monad<F>): Category<$<KleisliF, [F]>> =>
    Category.of({
      andThen_: F.andThen_,
      compose_: F.compose_,
      // eslint-disable-next-line prettier/prettier
      id: <A>() => (F).pure<A>,
    }),
);

export const kleisliArrow = cached(
  <F>(F: Monad<F>): Arrow<$<KleisliF, [F]>> =>
    Arrow.of({
      ...kleisliCategory(F),
      ...Strong.Kleisli<F>(F),

      lift: f => F1.compose(F.pure, f),
    }),
);

export const kleisliArrowChoice = cached(
  <F>(F: Monad<F>): ArrowChoice<$<KleisliF, [F]>> =>
    ArrowChoice.of({
      ...kleisliArrow(F),
      ...Choice.Kleisli(F),

      choose_:
        <A, B, C, D>(f: Kleisli<F, A, B>, g: Kleisli<F, C, D>) =>
        (ea: Either<A, C>): Kind<F, [Either<B, D>]> =>
          ea.fold<Kind<F, [Either<B, D>]>>(
            F1.andThen(f, F.map(Left<B, D>)),
            F1.andThen(g, F.map(Right<D, B>)),
          ),

      choice_:
        <A, B, C>(f: Kleisli<F, A, C>, g: Kleisli<F, B, C>) =>
        (ea: Either<A, B>) =>
          ea.fold(f, g),
    }),
);

export const kleisliArrowApply = cached(
  <F>(F: MonadDefer<F>): ArrowApply<$<KleisliF, [F]>> =>
    ArrowApply.of({
      ...kleisliArrow(F),

      app: lazy(
        <A, B>(): Kleisli<F, [Kleisli<F, A, B>, A], B> =>
          ([fab, a]) =>
            F.defer(() => fab(a)),
      ) as <A, B>() => Kleisli<F, [Kleisli<F, A, B>, A], B>,
    }),
);

export const kleisliArrowLoop = cached(
  <F>(F: Monad<F>): ArrowLoop<$<KleisliF, [F]>> =>
    ArrowLoop.of({
      ...kleisliArrow(F),
      ...Costrong.Kleisli(F),
    }),
);
