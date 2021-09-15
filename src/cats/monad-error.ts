import { AnyK } from '../core';
import { Monad } from './monad';
import { ApplicativeError } from './applicative-error';

export interface MonadError<F extends AnyK, E>
  extends ApplicativeError<F, E>,
    Monad<F> {}
