import {
  Semigroup,
  AdditionSemigroup,
  SemigroupRequirements,
  ConjunctionSemigroup,
  DisjunctionSemigroup,
} from './semigroup';

export interface Monoid<M> extends Semigroup<M> {
  readonly empty: M;
}

export type MonoidRequirements<M> = Pick<Monoid<M>, 'empty'> &
  SemigroupRequirements<M> &
  Partial<Monoid<M>>;
export const Monoid = Object.freeze({
  of: <M>(M: MonoidRequirements<M>): Monoid<M> => ({
    ...Semigroup.of(M),
    ...M,
  }),
});

// -- Builtin Semigroups

export const DisjunctionMonoid: Monoid<boolean> = {
  ...DisjunctionSemigroup,
  empty: false,
};

export const ConjunctionMonoid: Monoid<boolean> = {
  ...ConjunctionSemigroup,
  empty: true,
};

export const AdditionMonoid: Monoid<number> = {
  ...AdditionSemigroup,
  empty: 0,
};
