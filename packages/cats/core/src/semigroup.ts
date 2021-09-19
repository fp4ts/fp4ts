export interface Semigroup<S> {
  readonly combine: (y: S) => (x: S) => S;
  readonly combine_: (x: S, y: S) => S;
}

// -- Builtin Semigroups

export const DisjunctionSemigroup: Semigroup<boolean> = {
  combine: y => x => x || y,
  combine_: (x, y) => x || y,
};

export const ConjunctionSemigroup: Semigroup<boolean> = {
  combine: y => x => x && y,
  combine_: (x, y) => x && y,
};
