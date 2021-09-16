import { Monoid } from '../../../monoid';

export interface Measured<A, V> {
  readonly monoid: Monoid<V>;

  readonly measure: (a: A) => V;
}
