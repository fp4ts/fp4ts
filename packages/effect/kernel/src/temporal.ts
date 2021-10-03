import { Kind, AnyK } from '@cats4ts/core';
import { Concurrent } from './concurrent';
import { Clock } from './clock';

export interface Temporal<F extends AnyK, E>
  extends Concurrent<F, E>,
    Clock<F> {
  readonly sleep: (ms: number) => Kind<F, [void]>;

  readonly delayBy: <A>(fa: Kind<F, [A]>, ms: number) => Kind<F, [A]>;

  readonly timeoutTo: <A>(
    ioa: Kind<F, [A]>,
    ms: number,
    fallback: Kind<F, [A]>,
  ) => Kind<F, [A]>;

  readonly timeout: <A>(ioa: Kind<F, [A]>, ms: number) => Kind<F, [A]>;
}
