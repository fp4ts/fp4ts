import { Semigroup } from './semigroup';

export interface Monoid<M> extends Semigroup<M> {
  readonly empty: M;
}
