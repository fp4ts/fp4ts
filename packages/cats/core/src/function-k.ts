import { AnyK, Kind } from '@cats4ts/core';

export interface FunctionK<F extends AnyK, G extends AnyK> {
  <A>(fa: Kind<F, [A]>): Kind<G, [A]>;
}
