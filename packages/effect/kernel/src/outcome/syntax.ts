import { Kind } from '@cats4ts/core';
import { Outcome } from './algebra';
import { fold_ } from './operators';

declare module './algebra' {
  interface Outcome<F, E, A> {
    fold<B>(
      onCancel: () => B,
      onFailure: (e: E) => B,
      onSuccess: (fa: Kind<F, [A]>) => B,
    ): B;
  }
}

Outcome.prototype.fold = function <F, E, A, B>(
  this: Outcome<F, E, A>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, [A]>) => B,
): B {
  return fold_(this, onCancel, onFailure, onSuccess);
};
