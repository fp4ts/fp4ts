import { AnyK, Kind } from '../../core';

export interface Poll<F extends AnyK> {
  <A>(ioa: Kind<F, [A]>): Kind<F, [A]>;
}
