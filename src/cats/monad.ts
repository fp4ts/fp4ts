import { Applicative, Applicative2C, Applicative2 } from './applicative';
import { FlatMap, FlatMap2C, FlatMap2 } from './flat-map';

export interface Monad<F> extends FlatMap<F>, Applicative<F> {}

export interface Monad2C<F, E> extends FlatMap2C<F, E>, Applicative2C<F, E> {}

export interface Monad2<F> extends FlatMap2<F>, Applicative2<F> {}
