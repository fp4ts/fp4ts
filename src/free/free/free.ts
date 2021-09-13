import { Kind, URIS } from '../../core';
import { Free as FreeBase } from './algebra';
import { pure, suspend } from './constructors';

export type Free<F extends URIS, C, S, R, E, A> = FreeBase<F, C, S, R, E, A>;

export const Free: FreeObj = function <F extends URIS, C, S, R, E, A>(
  a: A,
): Free<F, C, S, R, E, A> {
  return pure(a);
};

interface FreeObj {
  <F extends URIS, C, S, R, E, A>(a: A): Free<F, C, S, R, E, A>;
  pure<F extends URIS, C, S, R, E, A>(a: A): Free<F, C, S, R, E, A>;
  suspend<F extends URIS, C, S, R, E, A>(
    a: Kind<F, C, S, R, E, A>,
  ): Free<F, C, S, R, E, A>;
}

Free.pure = pure;
Free.suspend = suspend;
