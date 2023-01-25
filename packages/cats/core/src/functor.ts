// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, instance, Kind, TyK, TyVar } from '@fp4ts/core';
import { Invariant } from './invariant';
import { ComposedFunctor } from './composed';
import { ArrayF } from './instances/array';
import { FunctorWithIndex } from './functor-with-index';

/**
 * @category Type Class
 */
export interface Functor<F> extends Invariant<F> {
  readonly map: <A, B>(f: (a: A) => B) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly map_: <A, B>(fa: Kind<F, [A]>, f: (a: A) => B) => Kind<F, [B]>;

  readonly tupleLeft: <B>(b: B) => <A>(fa: Kind<F, [A]>) => Kind<F, [[B, A]]>;
  readonly tupleLeft_: <A, B>(fa: Kind<F, [A]>, b: B) => Kind<F, [[B, A]]>;
  readonly tupleRight: <B>(b: B) => <A>(fa: Kind<F, [A]>) => Kind<F, [[A, B]]>;
  readonly tupleRight_: <A, B>(fa: Kind<F, [A]>, b: B) => Kind<F, [[A, B]]>;

  readonly tap: <A>(f: (a: A) => unknown) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly tap_: <A>(fa: Kind<F, [A]>, f: (a: A) => unknown) => Kind<F, [A]>;

  readonly void: <A>(fa: Kind<F, [A]>) => Kind<F, [void]>;
}

export type FunctorRequirements<F> = Pick<Functor<F>, 'map_'> &
  Partial<Functor<F>>;
export const Functor = Object.freeze({
  of: <F>(F: FunctorRequirements<F>): Functor<F> => {
    const self: Functor<F> = instance<Functor<F>>({
      map: f => fa => F.map_(fa, f),

      tupleLeft: b => fa => self.tupleLeft_(fa, b),
      tupleLeft_: (fa, b) => self.map_(fa, a => [b, a]),

      tupleRight: b => fa => self.tupleRight_(fa, b),
      tupleRight_: (fa, b) => self.map_(fa, a => [a, b]),

      imap: f => fa => F.map_(fa, f),
      imap_: (fa, f) => F.map_(fa, f),

      tap: f => fa => F.map_(fa, x => (f(x), x)),
      tap_: (fa, f) => F.map_(fa, x => (f(x), x)),

      void: fa => F.map_(fa, () => undefined),

      ...F,
    });
    return self;
  },

  compose: <F, G>(F: Functor<F>, G: Functor<G>): ComposedFunctor<F, G> =>
    ComposedFunctor.of(F, G),

  get ArrayF(): Functor<ArrayF> {
    return FunctorWithIndex.Array;
  },
});

// -- HKT

export interface FunctorF extends TyK<[unknown]> {
  [$type]: Functor<TyVar<this, 0>>;
}
