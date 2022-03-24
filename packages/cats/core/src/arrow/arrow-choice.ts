// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT, HKT2, id, Kind } from '@fp4ts/core';
import { Either } from '../data';

import { Arrow, ArrowRequirements } from './arrow';
import { Choice, ChoiceRequirements } from './choice';

/**
 * @category Type Class
 */
export interface ArrowChoice<F> extends Arrow<F>, Choice<F> {
  readonly choose: <A, B, C, D>(
    f: Kind<F, [A, C]>,
    g: Kind<F, [B, D]>,
  ) => Kind<F, [Either<A, B>, Either<C, D>]>;

  readonly left: <A, B, C>(
    fab: Kind<F, [A, B]>,
  ) => Kind<F, [Either<A, C>, Either<B, C>]>;

  readonly right: <A, B, C>(
    fab: Kind<F, [A, B]>,
  ) => Kind<F, [Either<C, A>, Either<C, B>]>;
}

export type ArrowChoiceRequirements<F> = Pick<ArrowChoice<F>, 'choose'> &
  ArrowRequirements<F> &
  Omit<ChoiceRequirements<F>, 'choice'> &
  Partial<ArrowChoice<F>>;

function of<F>(F: ArrowChoiceRequirements<F>): ArrowChoice<F>;
function of<F>(F: ArrowChoiceRequirements<HKT2<F>>): ArrowChoice<HKT2<F>> {
  const self: ArrowChoice<HKT2<F>> = {
    left: fab => self.choose(fab, self.lift(id)),
    right: fab => self.choose(self.lift(id), fab),

    ...Choice.of({
      ...F,
      choice:
        F.choice ??
        (<A, B, C>(
          f: HKT<F, [A, C]>,
          g: HKT<F, [B, C]>,
        ): HKT<F, [Either<A, B>, C]> =>
          self.rmap_(F.choose(f, g), ea => ea.fold(id, id))),
    }),
    ...Arrow.of(F),
    ...F,
  };
  return self;
}

export const ArrowChoice = Object.freeze({ of });
