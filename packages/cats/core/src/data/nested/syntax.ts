import { FunctionK } from '../../arrow';

import { Nested } from './algebra';
import { mapK_ } from './operators';

declare module './algebra' {
  interface Nested<F, G, A> {
    mapK<H>(nt: FunctionK<F, H>): Nested<H, G, A>;
  }
}

Nested.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};
