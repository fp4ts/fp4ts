// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { F1, id, lazy } from '@fp4ts/core';
import { Function1F } from '@fp4ts/cats-core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { Choice, Costrong, Strong } from '@fp4ts/cats-profunctor';
import { Arrow } from '../arrow';
import { ArrowApply } from '../arrow-apply';
import { ArrowChoice } from '../arrow-choice';
import { ArrowLoop } from '../arrow-loop';
import { Category } from '../category';
import { Compose } from '../compose';

export const functionCompose = lazy(
  (): Compose<Function1F> =>
    Compose.of({ compose_: F1.compose, andThen_: F1.andThen }),
);

export const functionCategory = lazy(
  (): Category<Function1F> =>
    Category.of({
      compose_: F1.compose,
      andThen_: F1.andThen,
      id: <A>() => id<A>,
    }),
);

export const functionArrow = lazy(
  (): Arrow<Function1F> =>
    Arrow.of({
      lift: id,

      split_:
        <A, B, C, D>(f: (a: A) => B, g: (c: C) => D) =>
        ([a, c]: [A, C]) =>
          [f(a), g(c)],
      merge_: (f, g) => F1.flatMap(f, c1 => F1.andThen(g, c2 => [c1, c2])),

      ...Strong.Function1,
      ...functionCategory(),
    }),
);

export const functionArrowChoice = lazy(
  (): ArrowChoice<Function1F> =>
    ArrowChoice.of({
      ...Choice.Function1,
      ...functionArrow(),

      choose_:
        <A, B, C, D>(f: (a: A) => B, g: (c: C) => D) =>
        (ea: Either<A, C>) =>
          ea.fold(F1.andThen(f, Left), F1.andThen(g, Right)),

      choice_:
        <A, B, C>(f: (a: A) => C, g: (b: B) => C) =>
        (ea: Either<A, B>) =>
          ea.fold(f, g),
    }),
);

export const functionArrowApply = lazy(
  (): ArrowApply<Function1F> =>
    ArrowApply.of({
      ...functionArrow(),

      app: lazy(
        <A, B>() =>
          ([f, a]: [(a: A) => B, A]): B =>
            f(a),
      ) as <A, B>() => (fa: [(a: A) => B, A]) => B,
    }),
);

export const functionArrowLoop = lazy(
  (): ArrowLoop<Function1F> =>
    ArrowLoop.of({
      ...functionArrow(),
      ...Costrong.Function1,
    }),
);
