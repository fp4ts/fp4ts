export interface Eq<A> {
  readonly equals: (lhs: A, rhs: A) => boolean;
  readonly noEquals: (lhs: A, rhs: A) => boolean;
}
