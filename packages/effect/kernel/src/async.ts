import { Kind } from '@cats4ts/core';
import { Either, Option } from '@cats4ts/cats-core/lib/data';

import { ExecutionContext } from './execution-context';
import { Sync } from './sync';
import { Temporal } from './temporal';

export interface Async<F> extends Sync<F>, Temporal<F, Error> {
  readonly async: <A>(
    k: (
      cb: (ea: Either<Error, A>) => void,
    ) => Kind<F, [Option<Kind<F, [void]>>]>,
  ) => Kind<F, [A]>;

  readonly async_: <A>(
    k: (cb: (ea: Either<Error, A>) => void) => Kind<F, [void]>,
  ) => Kind<F, [A]>;

  readonly never: Kind<F, [never]>;

  readonly readExecutionContext: Kind<F, [ExecutionContext]>;

  readonly executeOn: <A>(
    fa: Kind<F, [A]>,
    ec: ExecutionContext,
  ) => Kind<F, [A]>;

  readonly fromPromise: <A>(p: Kind<F, [Promise<A>]>) => Kind<F, [A]>;
}
