import { Kind } from '@fp4ts/core';
import { Nested } from './algebra';

export const liftF = <F, G, A>(fga: Kind<F, [Kind<G, [A]>]>): Nested<F, G, A> =>
  new Nested(fga);
