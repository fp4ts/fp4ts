import { Kind, URIS } from '../../core';
import { Free, Pure, Suspend } from './algebra';

export const pure = <F extends URIS, C, S, R, E, A>(
  a: A,
): Free<F, C, S, R, E, A> => new Pure(a);

export const suspend = <F extends URIS, C, S, R, E, A>(
  fa: Kind<F, C, S, R, E, A>,
): Free<F, C, S, R, E, A> => new Suspend(fa);
