import { Semigroup } from './semigroup';
import { Kind } from '../fp/hkt';

export interface SemigroupK<F> {
  readonly _URI: F;

  readonly combineK: <A>(x: Kind<F, A>, y: Kind<F, A>) => Kind<F, A>;

  readonly algebra: <A>() => Semigroup<Kind<F, A>>;
}

export const getSemigroupKAlgebra: <F>(
  F: SemigroupK<F>,
) => <A>() => Semigroup<Kind<F, A>> = F => () => ({
  combine: F.combineK,
});
