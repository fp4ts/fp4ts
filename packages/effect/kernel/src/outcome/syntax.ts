import { Kind } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { Outcome } from './algebra';
import { fold_, mapK_ } from './operators';

declare module './algebra' {
  interface Outcome<F, E, A> {
    mapK<G>(nt: FunctionK<F, G>): Outcome<G, E, A>;

    fold<B>(
      onCancel: () => B,
      onFailure: (e: E) => B,
      onSuccess: (fa: Kind<F, [A]>) => B,
    ): B;
  }
}

Outcome.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};

Outcome.prototype.fold = function <F, E, A, B>(
  this: Outcome<F, E, A>,
  onCancel: () => B,
  onFailure: (e: E) => B,
  onSuccess: (fa: Kind<F, [A]>) => B,
): B {
  return fold_(this, onCancel, onFailure, onSuccess);
};
