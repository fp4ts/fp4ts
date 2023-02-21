// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, Traversable } from '@fp4ts/cats-core';
import { Choice, ChoiceRequirements } from './choice';
import { Strong, StrongRequirements } from './strong';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Traversing<P> extends Choice<P>, Strong<P> {
  traverse<F>(
    F: Traversable<F>,
  ): <A, B>(pab: Kind<P, [A, B]>) => Kind<P, [Kind<F, [A]>, Kind<F, [B]>]>;
  traverse_<F, A, B>(
    F: Traversable<F>,
    pab: Kind<P, [A, B]>,
  ): Kind<P, [Kind<F, [A]>, Kind<F, [B]>]>;

  wander<S, T, A, B>(
    f: <F>(
      F: Applicative<F>,
    ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
  ): (pab: Kind<P, [A, B]>) => Kind<P, [S, T]>;
  wander_<S, T, A, B>(
    pab: Kind<P, [A, B]>,
    f: <F>(
      F: Applicative<F>,
    ) => (f: (a: A) => Kind<F, [B]>) => (s: S) => Kind<F, [T]>,
  ): Kind<P, [S, T]>;
}

export type TraversingRequirements<P> = Pick<Traversing<P>, 'wander_'> &
  ChoiceRequirements<P> &
  StrongRequirements<P> &
  Partial<Traversing<P>>;
export const Traversing = Object.freeze({
  of: <P>(P: TraversingRequirements<P>): Traversing<P> => {
    const self: Traversing<P> = {
      wander: f => pab => self.wander_(pab, f),

      traverse: F => pab => self.traverse_(F, pab),
      traverse_: <F, A, B>(F: Traversable<F>, pab: Kind<P, [A, B]>) =>
        self.wander_<Kind<F, [A]>, Kind<F, [B]>, A, B>(pab, F.traverse),

      ...Strong.of(P),
      ...Choice.of(P),
      ...P,
    };
    return self;
  },
});
