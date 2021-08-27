import { Applicative } from './applicative';
import { FlatMap } from './flat-map';

export interface Monad<F> extends FlatMap<F>, Applicative<F> {}
