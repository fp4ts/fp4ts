// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import {
  Applicative,
  Distributive,
  Function1F,
  Functor,
} from '@fp4ts/cats-core';
import { Closed, ClosedRequirements } from './closed';
import { Traversing, TraversingRequirements } from './traversing';
import { function1Mapping } from './instances/function';
import { kleisliMapping } from './instances/kleisli';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Mapping<P> extends Traversing<P>, Closed<P> {
  map<F>(
    F: Functor<F>,
  ): <A, B>(pab: Kind<P, [A, B]>) => Kind<P, [Kind<F, [A]>, Kind<F, [B]>]>;
  map_<F, A, B>(
    F: Functor<F>,
    pab: Kind<P, [A, B]>,
  ): Kind<P, [Kind<F, [A]>, Kind<F, [B]>]>;

  roam<S, T, A, B>(
    f: (g: (a: A) => B) => (s: S) => T,
  ): (pab: Kind<P, [A, B]>) => Kind<P, [S, T]>;
  roam_<S, T, A, B>(
    pab: Kind<P, [A, B]>,
    f: (g: (a: A) => B) => (s: S) => T,
  ): Kind<P, [S, T]>;
}

export type MappingRequirements<P> = Pick<Mapping<P>, 'roam_'> &
  TraversingRequirements<P> &
  ClosedRequirements<P> &
  Partial<Mapping<P>>;
export const Mapping = Object.freeze({
  of: <P>(P: MappingRequirements<P>): Mapping<P> => {
    const self: Mapping<P> = {
      map: F => pab => self.map_(F, pab),
      map_: (F, pab) => self.roam_(pab, F.map),

      roam: f => pab => self.roam_(pab, f),

      ...Closed.of(P),
      ...Traversing.of(P),
      ...P,
    };
    return self;
  },

  get Function1(): Mapping<Function1F> {
    return function1Mapping();
  },

  Kleisli: <F>(F: Applicative<F> & Distributive<F>) => kleisliMapping(F),
});
