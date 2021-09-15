import { AnyK, Kind } from '../../../core';
import { Outcome } from './algebra';
import { fold_ } from './operators';

declare module './algebra' {
  interface Outcome<F extends AnyK, E, A> {
    fold<B>(
      onCancel: () => B,
      onFailure: (e: E) => B,
      onSuccess: (fa: Kind<F, [A]>) => B,
    ): B;
  }
}

Outcome.prototype.fold = function <F extends AnyK, E, A, B>(
  this: Outcome<F, E, A>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, [A]>) => B,
): B {
  return fold_(this, onCancel, onFailure, onSuccess);
};
