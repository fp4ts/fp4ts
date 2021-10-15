import { Kind } from '@cats4ts/core';
import { Outcome } from './outcome';

export interface Fiber<F, E, A> {
  readonly join: Kind<F, [Outcome<F, E, A>]>;
  readonly joinWith: <B>(
    this: Fiber<F, E, B>,
    onCancel: Kind<F, [B]>,
  ) => Kind<F, [B]>;
  readonly joinWithNever: Kind<F, [A]>;
  readonly cancel: Kind<F, [void]>;
}
