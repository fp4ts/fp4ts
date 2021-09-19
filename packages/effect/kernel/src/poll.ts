import { AnyK, Kind } from '@cats4ts/core';

export interface Poll<F extends AnyK> {
  <A>(ioa: Kind<F, [A]>): Kind<F, [A]>;
}
