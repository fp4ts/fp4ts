// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { F1, Kind } from '@fp4ts/core';
import { Applicative } from './applicative';
import { Functor, FunctorRequirements } from './functor';
import { ArrayF, arrayCoflatMap } from './instances/array';
import { function1CoflatMap } from './instances/function';

export interface CoflatMap<F> extends Functor<F> {
  coflatMap<A, B>(
    f: (fa: Kind<F, [A]>) => B,
  ): (fa: Kind<F, [A]>) => Kind<F, [B]>;
  coflatMap_<A, B>(fa: Kind<F, [A]>, f: (fa: Kind<F, [A]>) => B): Kind<F, [B]>;

  coflatten<A>(fa: Kind<F, [A]>): Kind<F, [Kind<F, [A]>]>;

  // -- Cokleisli composition

  coandThen<B, C>(
    g: (fb: Kind<F, [B]>) => C,
  ): <A>(f: (fa: Kind<F, [A]>) => B) => (fa: Kind<F, [A]>) => C;
  coandThen_<A, B, C>(
    f: (fa: Kind<F, [A]>) => B,
    g: (fb: Kind<F, [B]>) => C,
  ): (fa: Kind<F, [A]>) => C;

  cocompose<A, B>(
    f: (fa: Kind<F, [A]>) => B,
  ): <C>(g: (fb: Kind<F, [B]>) => C) => (fa: Kind<F, [A]>) => C;
  cocompose_<A, B, C>(
    g: (fb: Kind<F, [B]>) => C,
    f: (fa: Kind<F, [A]>) => B,
  ): (fa: Kind<F, [A]>) => C;
}

export type CoflatMapRequirements<F> = Pick<CoflatMap<F>, 'coflatMap_'> &
  FunctorRequirements<F> &
  Partial<CoflatMap<F>>;
export const CoflatMap = Object.freeze({
  of: <F>(F: CoflatMapRequirements<F>): CoflatMap<F> => {
    const self: CoflatMap<F> = {
      coflatMap: f => fa => self.coflatMap_(fa, f),
      coflatten: fa => self.coflatMap_(fa, fa => fa),

      coandThen: g => f => self.coandThen_(f, g),
      coandThen_: (f, g) => F1.andThen(self.coflatMap(f), g),

      cocompose: f => g => self.cocompose_(g, f),
      cocompose_: (g, f) => F1.compose(g, self.coflatMap(f)),

      ...Functor.of(F),
      ...F,
    };

    return self;
  },

  fromApplicative: <F>(F: Applicative<F>): CoflatMap<F> =>
    CoflatMap.of({ map_: F.map_, coflatMap_: (fa, f) => F.pure(f(fa)) }),

  get Array(): CoflatMap<ArrayF> {
    return arrayCoflatMap();
  },

  Function1: <R>() => function1CoflatMap<R>(),
});
