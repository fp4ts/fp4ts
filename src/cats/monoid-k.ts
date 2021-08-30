import { Kind } from '../fp/hkt';
import { Monoid } from './monoid';
import { SemigroupK } from './semigroup-k';

export interface MonoidK<F> extends SemigroupK<F> {
  readonly emptyK: <A>() => Kind<F, A>;

  readonly algebra: <A>() => Monoid<Kind<F, A>>;
}

export const getMonoidKAlgebra: <F>(
  F: MonoidK<F>,
) => <A>() => Monoid<Kind<F, A>> = F => () => ({
  empty: F.emptyK(),
  combine: F.combineK,
});
