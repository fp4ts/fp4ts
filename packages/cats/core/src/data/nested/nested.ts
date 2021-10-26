import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '../../eq';
import { Applicative } from '../../applicative';

import { Nested as NestedBase } from './algebra';
import { liftF } from './constructors';
import { nestedApplicative, nestedEq } from './instances';

export type Nested<F, G, A> = NestedBase<F, G, A>;
export const Nested: NestedObj = function <F, G, A>(
  fga: Kind<F, [Kind<G, [A]>]>,
): Nested<F, G, A> {
  return liftF(fga);
};

interface NestedObj {
  <F, G, A>(fga: Kind<F, [Kind<G, [A]>]>): Nested<F, G, A>;
  liftF<F, G, A>(fga: Kind<F, [Kind<G, [A]>]>): Nested<F, G, A>;

  Eq<F, G, A>(E: Eq<Kind<F, [Kind<G, [A]>]>>): Eq<Nested<F, G, A>>;

  Applicative<F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): Applicative<$<NestedK, [F, G]>>;
}

Nested.liftF = liftF;
Nested.Eq = nestedEq;
Nested.Applicative = nestedApplicative;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface NestedK extends TyK<[unknown, unknown, unknown]> {
  [$type]: Nested<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
