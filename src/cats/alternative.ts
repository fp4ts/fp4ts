import { Applicative, Applicative2C, Applicative2 } from './applicative';
import { MonoidK, MonoidK2C, MonoidK2 } from './monoid-k';

export interface Alternative<F> extends Applicative<F>, MonoidK<F> {}

export interface Alternative2C<F, E>
  extends Applicative2C<F, E>,
    MonoidK2C<F, E> {}

export interface Alternative2<F> extends Applicative2<F>, MonoidK2<F> {}
