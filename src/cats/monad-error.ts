import { Monad } from './monad';
import { ApplicativeError } from './applicative-error';

export interface MonadError<F, E> extends ApplicativeError<F, E>, Monad<F> {}
