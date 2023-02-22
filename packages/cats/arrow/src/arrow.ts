// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Strong } from '@fp4ts/cats-profunctor';
import { Category } from './category';
import { functionArrow } from './instances/function';

/**
 * @category Type Class
 * @category Arrow
 */
export interface Arrow<P> extends Category<P>, Strong<P> {
  lift<A, B>(f: (a: A) => B): Kind<P, [A, B]>;

  split<C, D>(
    g: Kind<P, [C, D]>,
  ): <A, B>(f: Kind<P, [A, B]>) => Kind<P, [[A, C], [B, D]]>;
  split_<A, B, C, D>(
    f: Kind<P, [A, B]>,
    g: Kind<P, [C, D]>,
  ): Kind<P, [[A, C], [B, D]]>;

  merge<A, C>(
    g: Kind<P, [A, C]>,
  ): <B>(f: Kind<P, [A, B]>) => Kind<P, [A, [B, C]]>;
  merge_<A, B, C>(f: Kind<P, [A, B]>, g: Kind<P, [A, C]>): Kind<P, [A, [B, C]]>;
}

export type ArrowRequirements<P> = Pick<Arrow<P>, 'lift'> &
  (Pick<Arrow<P>, 'first'> | Pick<Arrow<P>, 'second'>) &
  (Pick<Arrow<P>, 'compose_'> | Pick<Arrow<P>, 'andThen_'>) &
  Partial<Arrow<P>>;
export const Arrow = Object.freeze({
  of: <P>(P: ArrowRequirements<P>): Arrow<P> => {
    const self: Arrow<P> = {
      split: g => f => self.split_(f, g),
      split_: <A, B, C, D>(f: Kind<P, [A, B]>, g: Kind<P, [C, D]>) =>
        self.andThen_(self.first<C>()(f), self.second<B>()(g)),

      merge: g => f => self.merge_(f, g),
      merge_: <A, B, C>(f: Kind<P, [A, B]>, g: Kind<P, [A, C]>) =>
        self.andThen_(
          self.lift((x: A) => [x, x]),
          self.split_(f, g),
        ),

      ...Category.of({ id: P.id ?? (<A>() => P.lift(id<A>)), ...P }),
      ...Strong.of({
        dimap_: (pab, f, g) =>
          self.andThen_(self.compose_(pab, self.lift(f)), self.lift(g)),
        lmap_: (pab, f) => self.compose_(pab, self.lift(f)),
        rmap_: (pab, g) => self.andThen_(pab, self.lift(g)),
        ...P,
      }),
      ...P,
    };
    return self;
  },

  get Function1() {
    return functionArrow();
  },
});
