// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, cached, F1 } from '@fp4ts/core';
import { CoflatMap, Comonad } from '@fp4ts/cats-core';
import { CokleisliF } from '@fp4ts/cats-core/lib/data';
import { Costrong, Strong } from '@fp4ts/cats-profunctor';
import { ArrowLoop } from '../arrow-loop';
import { Arrow } from '../arrow';
import { Category } from '../category';
import { Compose } from '../compose';

export const cokleisliCompose = cached(
  <F>(F: CoflatMap<F>): Compose<$<CokleisliF, [F]>> =>
    Compose.of({
      compose_: (fbc, fab) => F1.compose(fbc, F.coflatMap(fab)),
      andThen_: (fab, fcb) => F1.andThen(F.coflatMap(fab), fcb),
    }),
);

export const cokleisliCategory = cached(
  <F>(F: Comonad<F>): Category<$<CokleisliF, [F]>> =>
    Category.of({
      compose_: (fbc, fab) => F1.compose(fbc, F.coflatMap(fab)),
      andThen_: (fab, fcb) => F1.andThen(F.coflatMap(fab), fcb),
      // eslint-disable-next-line prettier/prettier
      id: <A>() => (F).extract<A>,
    }),
);

export const cokleisliArrow = cached(
  <F>(F: Comonad<F>): Arrow<$<CokleisliF, [F]>> =>
    Arrow.of({
      ...cokleisliCategory(F),
      ...Strong.Cokleisli(F),
      // eslint-disable-next-line prettier/prettier
      lift: <A, B>(f: (a: A) => B) => F1.compose(f, (F).extract<A>),
    }),
);

export const cokleisliArrowLoop = cached(
  <F>(F: Comonad<F>): ArrowLoop<$<CokleisliF, [F]>> =>
    ArrowLoop.of({
      ...cokleisliArrow(F),
      ...Costrong.Cokleisli(F),
    }),
);
