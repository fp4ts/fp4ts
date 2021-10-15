import { Kind } from '@cats4ts/core';

export interface FunctionK<F, G> {
  <A>(fa: Kind<F, [A]>): Kind<G, [A]>;
}
