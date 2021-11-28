// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind, α, λ } from '@fp4ts/core';
import { SemigroupK } from '../semigroup-k';
import { Semigroup } from '../semigroup';

/**
 * @category Type Class
 */
export interface Compose<F> {
  readonly compose: <A, B>(
    g: Kind<F, [A, B]>,
  ) => <C>(f: Kind<F, [B, C]>) => Kind<F, [A, C]>;
  readonly compose_: <A, B, C>(
    f: Kind<F, [B, C]>,
    g: Kind<F, [A, B]>,
  ) => Kind<F, [A, C]>;

  readonly andThen: <B, C>(
    g: Kind<F, [B, C]>,
  ) => <A>(f: Kind<F, [A, B]>) => Kind<F, [A, B]>;
  readonly andThen_: <A, B, C>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [B, C]>,
  ) => Kind<F, [A, B]>;

  readonly algebraK: () => SemigroupK<λ<F, [α, α]>>;
  readonly algebra: <A>() => Semigroup<Kind<F, [A, A]>>;
}

export type ComposeRequirements<F> = Pick<Compose<F>, 'compose_'> &
  Partial<Compose<F>>;
export const Compose = Object.freeze({
  of: <F>(F: ComposeRequirements<F>): Compose<F> => {
    const self: Compose<F> = instance<Compose<F>>({
      compose: g => f => self.compose_(f, g),

      andThen: g => f => self.andThen_(f, g),
      andThen_: (f, g) => self.compose_(g, f),

      algebraK: () =>
        SemigroupK.of<λ<F, [α, α]>>({
          combineK_: (fx, fy) => self.compose_(fx, fy()),
        }),

      algebra: () =>
        Semigroup.of({
          combine_: (fx, fy) => self.compose_(fx, fy()),
        }),

      ...F,
    });
    return self;
  },
});
