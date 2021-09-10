import { Kind, URIS } from '../../../core';
import { Outcome } from './algebra';
import { fold_ } from './operators';

declare module './algebra' {
  interface Outcome<F extends URIS, E, A, C> {
    fold<S2, R2, E2, B>(
      onCancel: () => B,
      onFailure: (e: E) => B,
      onSuccess: (fa: Kind<F, C, S2, R2, E2, A>) => B,
    ): B;
  }
}

Outcome.prototype.fold = function <F extends URIS, S2, R2, E2, E, A, C, B>(
  this: Outcome<F, E, A, C>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, C, S2, R2, E2, A>) => B,
): B {
  return fold_(this, onCancel, onFailure, onSuccess);
};
