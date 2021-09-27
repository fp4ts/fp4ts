import { AnyK } from '@cats4ts/core';
import { FunctionK } from '../../function-k';

import { Tuple2K } from './algebra';
import { mapK_, swapped } from './operators';

declare module './algebra' {
  interface Tuple2K<F extends AnyK, G extends AnyK, A> {
    readonly swapped: Tuple2K<G, F, A>;

    mapK<H extends AnyK>(nt: FunctionK<G, H>): Tuple2K<F, H, A>;
  }
}

Object.defineProperty(Tuple2K.prototype, 'swapped', {
  get<F extends AnyK, G extends AnyK, A>(
    this: Tuple2K<F, G, A>,
  ): Tuple2K<G, F, A> {
    return swapped(this);
  },
});

Tuple2K.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};
