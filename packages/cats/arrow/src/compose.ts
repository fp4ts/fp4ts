// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind, lazy, α, λ } from '@fp4ts/core';
import { Semigroup } from '@fp4ts/cats-kernel';
import { SemigroupK } from '@fp4ts/cats-core';
import { functionCompose } from './instances/function';

/**
 * @category Type Class
 * @category Arrow
 */
export interface Compose<P> extends Base<P> {
  compose<A, B>(f: Kind<P, [A, B]>): <C>(g: Kind<P, [B, C]>) => Kind<P, [A, C]>;
  compose_<A, B, C>(g: Kind<P, [B, C]>, f: Kind<P, [A, B]>): Kind<P, [A, C]>;

  andThen<B, C>(g: Kind<P, [B, C]>): <A>(f: Kind<P, [A, B]>) => Kind<P, [A, C]>;
  andThen_<A, B, C>(f: Kind<P, [A, B]>, g: Kind<P, [B, C]>): Kind<P, [A, C]>;

  algebraK(): SemigroupK<λ<P, [α, α]>>;
  algebra<A>(): Semigroup<Kind<P, [A, A]>>;
}

export type ComposeRequirements<P> = (
  | Pick<Compose<P>, 'compose_'>
  | Pick<Compose<P>, 'andThen_'>
) &
  Partial<Compose<P>>;
export const Compose = Object.freeze({
  of: <P>(P: ComposeRequirements<P>) => {
    const self: Compose<P> = instance<Compose<P>>({
      compose: f => g => self.compose_(g, f),
      compose_: P.compose_ ?? ((g, f) => self.andThen_(f, g)),

      andThen: g => f => self.andThen_(f, g),
      andThen_: P.andThen_ ?? ((f, g) => self.compose_(g, f)),

      algebraK: lazy(() =>
        SemigroupK.of<λ<P, [α, α]>>({ combineK_: self.compose_ }),
      ),

      algebra: lazy(() => Semigroup.of({ combine_: self.compose_ })),

      ...P,
    });
    return self;
  },

  get Function1() {
    return functionCompose();
  },
});
