import { Kind1, URIS } from '../../../core';
import { Outcome } from './algebra';
import { fold_ } from './operators';

declare module './algebra' {
  interface Outcome<F extends URIS, E, A> {
    fold<C2, B>(
      onCancel: () => B,
      onFailure: (e: E) => B,
      onSuccess: (fa: Kind1<F, C2, A>) => B,
    ): B;
  }
}

Outcome.prototype.fold = function <F extends URIS, C2, E, A, B>(
  this: Outcome<F, E, A>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind1<F, C2, A>) => B,
): B {
  return fold_(this, onCancel, onFailure, onSuccess);
};
