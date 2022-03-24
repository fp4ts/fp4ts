// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT2, Kind } from '@fp4ts/core';
import { Either } from '../data';
import { Category, CategoryRequirements } from './category';

/**
 * @category Type Class
 */
export interface Choice<F> extends Category<F> {
  readonly choice: <A, B, C>(
    f: Kind<F, [A, C]>,
    g: Kind<F, [B, C]>,
  ) => Kind<F, [Either<A, B>, C]>;

  readonly codiagonal: <A>() => Kind<F, [Either<A, A>, A]>;
}

export type ChoiceRequirements<F> = Pick<Choice<F>, 'choice'> &
  CategoryRequirements<F> &
  Partial<Choice<F>>;

function of<F>(F: ChoiceRequirements<F>): Choice<F>;
function of<F>(F: ChoiceRequirements<HKT2<F>>): Choice<HKT2<F>> {
  const self: Choice<HKT2<F>> = {
    codiagonal: () => self.choice(self.id(), self.id()),

    ...Category.of(F),
    ...F,
  };
  return self;
}

export const Choice = Object.freeze({ of });
