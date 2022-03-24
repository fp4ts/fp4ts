// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT, HKT2, id, Kind } from '@fp4ts/core';
import { Category } from './category';
import { Strong } from './strong';

/**
 * @category Type Class
 */
export interface Arrow<F> extends Category<F>, Strong<F> {
  readonly lift: <A, B>(f: (a: A) => B) => Kind<F, [A, B]>;

  readonly split: <C, D>(
    g: Kind<F, [C, D]>,
  ) => <A, B>(f: Kind<F, [A, B]>) => Kind<F, [[A, C], [B, D]]>;
  readonly split_: <A, B, C, D>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [C, D]>,
  ) => Kind<F, [[A, C], [B, D]]>;

  readonly merge: <A, C>(
    g: Kind<F, [A, C]>,
  ) => <B>(f: Kind<F, [A, B]>) => Kind<F, [A, [B, C]]>;
  readonly merge_: <A, B, C>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [A, C]>,
  ) => Kind<F, [A, [B, C]]>;
}

export type ArrowRequirements<F> = Pick<
  Arrow<F>,
  'lift' | 'first' | 'compose_'
> &
  Partial<Arrow<F>>;

function of<F>(F: ArrowRequirements<F>): Arrow<F>;
function of<F>(F: ArrowRequirements<HKT2<F>>): Arrow<HKT2<F>> {
  const self: Arrow<HKT2<F>> = {
    split: g => f => self.split_(f, g),
    split_: (f, g) => self.andThen_(self.first(f), self.second(g)),

    merge: g => f => self.merge_(f, g),
    merge_: <A, B, C>(f: HKT<F, [A, B]>, g: HKT<F, [A, C]>) =>
      self.andThen_(
        self.lift((x: A) => [x, x]),
        self.split_(f, g),
      ),

    ...Category.of({ id: F.id ?? (<A>() => self.lift<A, A>(id)), ...F }),
    ...Strong.of({
      dimap_:
        F.dimap_ ??
        ((fab, f, g) =>
          self.compose_(self.lift(g), self.andThen_(self.lift(f), fab))),
      second:
        F.second ??
        (<A, B, C>(fab: HKT<F, [A, B]>): HKT<F, [[C, A], [C, B]]> => {
          const swap = <X, Y>(): HKT<F, [[X, Y], [Y, X]]> =>
            self.lift(([x, y]: [X, Y]) => [y, x] as [Y, X]);

          return self.andThen_(
            self.compose_(self.first<A, B, C>(fab), swap()),
            swap(),
          );
        }),
      ...F,
    }),
    ...F,
  };
  return self;
}

export const Arrow = Object.freeze({ of });
