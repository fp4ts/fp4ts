// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { F1, id, Kind } from '@fp4ts/core';
import { Apply } from './apply';
import { Either, Left } from './data';
import { ArrayF, arrayFlatMap } from './instances/array';
import { isStackSafeMonad } from './stack-safe-monad';

/**
 * @category Type Class
 */
export interface FlatMap<F> extends Apply<F> {
  readonly flatMap: <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly flatMap_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [B]>,
  ) => Kind<F, [B]>;

  readonly flatTap: <A>(
    f: (a: A) => Kind<F, [unknown]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly flatTap_: <A>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [unknown]>,
  ) => Kind<F, [A]>;

  readonly flatten: <A>(ffa: Kind<F, [Kind<F, [A]>]>) => Kind<F, [A]>;

  readonly tailRecM: <A>(
    a: A,
  ) => <B>(f: (a: A) => Kind<F, [Either<A, B>]>) => Kind<F, [B]>;
  readonly tailRecM_: <A, B>(
    a: A,
    f: (a: A) => Kind<F, [Either<A, B>]>,
  ) => Kind<F, [B]>;

  readonly foreverM: <A>(fa: Kind<F, [A]>) => Kind<F, [never]>;

  // -- Kleisli composition

  andThen<B, C>(
    g: (b: B) => Kind<F, [C]>,
  ): <A>(f: (a: A) => Kind<F, [B]>) => (a: A) => Kind<F, [C]>;
  andThen_<A, B, C>(
    f: (a: A) => Kind<F, [B]>,
    g: (b: B) => Kind<F, [C]>,
  ): (a: A) => Kind<F, [C]>;

  compose<A, B>(
    f: (a: A) => Kind<F, [B]>,
  ): <C>(g: (b: B) => Kind<F, [C]>) => (a: A) => Kind<F, [C]>;
  compose_<A, B, C>(
    g: (b: B) => Kind<F, [C]>,
    f: (a: A) => Kind<F, [B]>,
  ): (a: A) => Kind<F, [C]>;
}

export type FlatMapRequirements<F> = Pick<
  FlatMap<F>,
  'flatMap_' | 'map_' | 'tailRecM_'
> &
  Partial<FlatMap<F>>;
export const FlatMap = Object.freeze({
  of: <F>(F: FlatMapRequirements<F>): FlatMap<F> => {
    const self: FlatMap<F> = {
      flatMap: f => fa => self.flatMap_(fa, f),

      flatTap: f => fa => self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      tailRecM: a => f => self.tailRecM_(a, f),

      foreverM: <A>(fa: Kind<F, [A]>): Kind<F, [never]> => {
        const leftUnit = Left(undefined as void);
        const stepResult: Kind<F, [Either<void, never>]> = self.map_(
          fa,
          () => leftUnit,
        );
        return self.tailRecM(undefined as void)(() => stepResult);
      },

      andThen: g => f => self.andThen_(f, g),
      andThen_: (f, g) => F1.andThen(f, self.flatMap(g)),

      compose: f => g => self.compose_(g, f),
      compose_: (g, f) => F1.compose(self.flatMap(g), f),

      ...Apply.of({
        ap_: (ff, fa) => F.flatMap_(ff, f => F.map_(fa, a => f(a))),
        map2_:
          <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) =>
          <C>(f: (a: A, b: B) => C) =>
            F.flatMap_(fa, a => F.map_(fb, b => f(a, b))),
        ...F,
      }),
      ...F,
    };

    return self;
  },

  get Array(): FlatMap<ArrayF> {
    return arrayFlatMap();
  },
});
