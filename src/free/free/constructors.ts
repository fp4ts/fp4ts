import { AnyK, Kind } from '../../core';
import { Free, Pure, Suspend } from './algebra';

export const pure = <F extends AnyK, A>(a: A): Free<F, A> => new Pure(a);

export const suspend = <F extends AnyK, A>(fa: Kind<F, [A]>): Free<F, A> =>
  new Suspend(fa);
