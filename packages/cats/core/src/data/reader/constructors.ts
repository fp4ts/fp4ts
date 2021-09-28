import { Identity } from '../identity';
import * as K from '../kleisli/functional';
import { Reader } from './algebra';

export const pure = <A>(a: A): Reader<unknown, A> =>
  new Reader(K.pure(Identity.Applicative)(a));

export const unit: Reader<unknown, void> = new Reader(K.liftF(undefined));

export const read = <R>(): Reader<R, R> =>
  new Reader(K.identity(Identity.Applicative));
