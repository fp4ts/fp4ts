export interface Semigroup<S> {
  readonly combine: (x: S) => (y: S) => S;
  readonly combine_: (x: S, y: S) => S;
}
