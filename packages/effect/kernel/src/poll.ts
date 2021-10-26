import { Kind } from '@fp4ts/core';

export interface Poll<F> {
  <A>(ioa: Kind<F, [A]>): Kind<F, [A]>;
}
