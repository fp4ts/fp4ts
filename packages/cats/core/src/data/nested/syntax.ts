import { AnyK } from '@cats4ts/core';
import { FunctionK } from '../../function-k';

import { Nested } from './algebra';
import { mapK_ } from './operators';

declare module './algebra' {
  interface Nested<F extends AnyK, G extends AnyK, A> {
    mapK<H extends AnyK>(nt: FunctionK<F, H>): Nested<H, G, A>;
  }
}

Nested.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};
