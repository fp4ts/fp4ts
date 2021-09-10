import { Kind, Auto, URIS } from '../../core';
import { Either, Option } from '../../cats/data';
import { ExecutionContext } from '../execution-context';
import { Sync } from './sync';
import { Temporal } from './temporal';

export interface Async<F extends URIS, C = Auto>
  extends Sync<F, C>,
    Temporal<F, Error, C> {
  readonly async: <S, R, A>(
    k: (
      cb: (ea: Either<Error, A>) => void,
    ) => Kind<F, C, S, R, Error, Option<Kind<F, C, S, R, Error, void>>>,
  ) => Kind<F, C, S, R, Error, A>;

  readonly async_: <S, R, A>(
    k: (cb: (ea: Either<Error, A>) => void) => Kind<F, C, S, R, Error, void>,
  ) => Kind<F, C, S, R, Error, A>;

  readonly never: Kind<F, C, unknown, unknown, Error, never>;

  readonly executeOn: <S, R, A>(
    fa: Kind<F, C, S, R, Error, A>,
    ec: ExecutionContext,
  ) => Kind<F, C, S, R, Error, A>;

  readonly fromPromise: <S, R, A>(
    p: Kind<F, C, S, R, Error, Promise<A>>,
  ) => Kind<F, C, S, R, Error, A>;
}
