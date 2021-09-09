import { ConjunctionSemigroup, DisjunctionSemigroup } from '.';
import { Semigroup } from './semigroup';

export interface Monoid<M> extends Semigroup<M> {
  readonly empty: M;
}

// -- Builtin Semigroups

export const DisjunctionMonoid: Monoid<boolean> = {
  ...DisjunctionSemigroup,
  empty: false,
};

export const ConjunctionMonoid: Monoid<boolean> = {
  ...ConjunctionSemigroup,
  empty: true,
};
