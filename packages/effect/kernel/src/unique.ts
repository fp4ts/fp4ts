import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';

export interface Unique<F> {
  unique: Kind<F, [UniqueToken]>;
}
export type UniqueRequirements<F> = Pick<Unique<F>, 'unique'>;
export const Unique = Object.freeze({
  of: <F>(F: UniqueRequirements<F>): Unique<F> => ({
    ...F,
  }),
});

export class UniqueToken {
  public equals(that: UniqueToken): boolean {
    return this === that;
  }
  public notEquals(that: UniqueToken): boolean {
    return this !== that;
  }

  public static Eq: Eq<UniqueToken> = Eq.of({ equals: (x, y) => x.equals(y) });
}
