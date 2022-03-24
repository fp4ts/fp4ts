// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT, HKT1, id, Kind } from '@fp4ts/core';
import { Apply } from './apply';
import { Either, Left } from './data';

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
}

export type FlatMapRequirements<F> = Pick<
  FlatMap<F>,
  'flatMap_' | 'map_' | 'tailRecM_'
> &
  Partial<FlatMap<F>>;
function of<F>(F: FlatMapRequirements<F>): FlatMap<F>;
function of<F>(F: FlatMapRequirements<HKT1<F>>): FlatMap<HKT1<F>> {
  const self: FlatMap<HKT1<F>> = {
    flatMap: f => fa => self.flatMap_(fa, f),

    flatTap: f => fa => self.flatTap_(fa, f),

    flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

    flatten: ffa => self.flatMap_(ffa, id),

    tailRecM: a => f => self.tailRecM_(a, f),

    foreverM: <A>(fa: HKT<F, [A]>): HKT<F, [never]> => {
      const leftUnit = Left(undefined as void);
      const stepResult: HKT<F, [Either<void, never>]> = self.map_(
        fa,
        () => leftUnit,
      );
      return self.tailRecM(undefined as void)(() => stepResult);
    },

    ...FlatMap.deriveApply(F),
    ...F,
  };

  return self;
}
function deriveApply<F>(F: FlatMapRequirements<F>): Apply<F>;
function deriveApply<F>(F: FlatMapRequirements<HKT1<F>>): Apply<HKT1<F>> {
  return Apply.of<HKT1<F>>({
    ap_: (ff, fa) => F.flatMap_(ff, f => F.map_(fa, a => f(a))),
    ...F,
  });
}
export const FlatMap = Object.freeze({
  of,
  deriveApply,
});
