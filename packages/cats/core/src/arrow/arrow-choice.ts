import { id, Kind } from '@cats4ts/core';
import { Either } from '../data';

import { Arrow, ArrowRequirements } from './arrow';
import { Choice, ChoiceRequirements } from './choice';

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
  ChoiceRequirements<F> &
  Partial<ArrowChoice<F>>;
export const ArrowChoice = Object.freeze({
  of: <F>(F: ArrowChoiceRequirements<F>): ArrowChoice<F> => {
    const self: ArrowChoice<F> = {
      left: fab => self.choose(fab, self.lift(id)),
      right: fab => self.choose(self.lift(id), fab),

      ...Choice.of(F),
      ...Arrow.of(F),
      ...F,
    };
    return self;
  },
});
