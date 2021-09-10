import { Auto } from '../core';
import { Monad } from './monad';
import { ApplicativeError } from './applicative-error';

export interface MonadError<F, E, C = Auto>
  extends ApplicativeError<F, E, C>,
    Monad<F, C> {}
