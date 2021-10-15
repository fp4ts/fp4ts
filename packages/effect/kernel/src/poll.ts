import { Kind } from '@cats4ts/core';

export interface Poll<F> {
  <A>(ioa: Kind<F, [A]>): Kind<F, [A]>;
}
