import { Semigroup } from './semigroup';
import { Kind, Kind2 } from '../fp/hkt';

export interface SemigroupK<F> {
  readonly URI: F;

  readonly combineK: <A>(x: Kind<F, A>, y: Kind<F, A>) => Kind<F, A>;

  readonly algebra: <A>() => Semigroup<Kind<F, A>>;
}

export const getSemigroupKAlgebra: <F>(
  F: SemigroupK<F>,
) => <A>() => Semigroup<Kind<F, A>> = F => () => ({
  combine: F.combineK,
});

export interface SemigroupK2C<F, E> {
  readonly URI: F;

  readonly combineK: <A>(
    x: Kind2<F, E, A>,
    y: Kind2<F, E, A>,
  ) => Kind2<F, E, A>;

  readonly algebra: <A>() => Semigroup<Kind2<F, E, A>>;
}

export const getSemigroupK2cAlgebra: <F, E>(
  F: SemigroupK2C<F, E>,
) => <A>() => Semigroup<Kind2<F, E, A>> = F => () => ({
  combine: F.combineK,
});

export interface SemigroupK2<F> {
  readonly URI: F;

  readonly combineK: <E, A>(
    x: Kind2<F, E, A>,
    y: Kind2<F, E, A>,
  ) => Kind2<F, E, A>;

  readonly algebra: <E, A>() => Semigroup<Kind2<F, E, A>>;
}

export const getSemigroupK2Algebra: <F>(
  F: SemigroupK2<F>,
) => <E, A>() => Semigroup<Kind2<F, E, A>> = F => () => ({
  combine: F.combineK,
});
