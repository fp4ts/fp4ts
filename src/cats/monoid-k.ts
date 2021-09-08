import { Kind, Kind2 } from '../fp/hkt';
import { Monoid } from './monoid';
import { SemigroupK, SemigroupK2C, SemigroupK2 } from './semigroup-k';

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

export interface MonoidK2C<F, E> extends SemigroupK2C<F, E> {
  readonly emptyK: <A>() => Kind2<F, E, A>;

  readonly algebra: <A>() => Monoid<Kind2<F, E, A>>;
}

export const getMonoidK2CAlgebra: <F, E>(
  F: MonoidK2C<F, E>,
) => <A>() => Monoid<Kind2<F, E, A>> = F => () => ({
  empty: F.emptyK(),
  combine: F.combineK,
});

export interface MonoidK2<F> extends SemigroupK2<F> {
  readonly emptyK: <E, A>() => Kind2<F, E, A>;

  readonly algebra: <E, A>() => Monoid<Kind2<F, E, A>>;
}

export const getMonoidK2Algebra: <F>(
  F: MonoidK2<F>,
) => <E, A>() => Monoid<Kind2<F, E, A>> = F => () => ({
  empty: F.emptyK(),
  combine: F.combineK,
});
