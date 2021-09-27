export interface Semigroup<S> {
  readonly combine: (y: S) => (x: S) => S;
  readonly combine_: (x: S, y: S) => S;
}

export type SemigroupRequirements<A> = Pick<Semigroup<A>, 'combine_'> &
  Partial<Semigroup<A>>;
export const Semigroup = Object.freeze({
  of: <A>(S: SemigroupRequirements<A>): Semigroup<A> => ({
    combine: y => x => S.combine_(x, y),
    ...S,
  }),
});

// -- Builtin Semigroups

export const DisjunctionSemigroup: Semigroup<boolean> = Semigroup.of({
  combine_: (x, y) => x || y,
});

export const ConjunctionSemigroup: Semigroup<boolean> = Semigroup.of({
  combine_: (x, y) => x && y,
});

export const AdditionSemigroup: Semigroup<number> = Semigroup.of({
  combine_: (x, y) => x + y,
});
