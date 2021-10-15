import { Kind } from '@cats4ts/core';
import { Either } from '../data';
import { Category, CategoryRequirements } from './category';

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
export const Choice = Object.freeze({
  of: <F>(F: ChoiceRequirements<F>): Choice<F> => {
    const self: Choice<F> = {
      codiagonal: () => self.choice(self.id(), self.id()),

      ...Category.of(F),
      ...F,
    };
    return self;
  },
});
