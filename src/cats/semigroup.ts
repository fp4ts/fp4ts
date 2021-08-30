export interface Semigroup<S> {
  readonly combine: (x: S, y: S) => S;
}
