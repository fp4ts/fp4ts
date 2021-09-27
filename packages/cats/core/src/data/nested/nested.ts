import { $, AnyK, Kind, TyK, _ } from '@cats4ts/core';
import { Eq } from '../../eq';
import { Applicative } from '../../applicative';

import { Nested as NestedBase } from './algebra';
import { liftF } from './constructors';
import { nestedApplicative, nestedEq } from './instances';

export type Nested<F extends AnyK, G extends AnyK, A> = NestedBase<F, G, A>;
export const Nested: NestedObj = function <F extends AnyK, G extends AnyK, A>(
  fga: Kind<F, [Kind<G, [A]>]>,
): Nested<F, G, A> {
  return liftF(fga);
};

interface NestedObj {
  <F extends AnyK, G extends AnyK, A>(fga: Kind<F, [Kind<G, [A]>]>): Nested<
    F,
    G,
    A
  >;
  liftF<F extends AnyK, G extends AnyK, A>(
    fga: Kind<F, [Kind<G, [A]>]>,
  ): Nested<F, G, A>;

  Eq<F extends AnyK, G extends AnyK, A>(
    E: Eq<Kind<F, [Kind<G, [A]>]>>,
  ): Eq<Nested<F, G, A>>;

  Applicative<F extends AnyK, G extends AnyK>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): Applicative<$<NestedK, [F, G]>>;
}

Nested.liftF = liftF;
Nested.Eq = nestedEq;
Nested.Applicative = nestedApplicative;

// -- HKT

const NestedURI = '@cats4ts/cats/core/data/nested';
type NestedURI = typeof NestedURI;
export type NestedK = TyK<NestedURI, [_, _, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [NestedURI]: [Tys[0]] extends [AnyK]
      ? [Tys[1]] extends [AnyK]
        ? Nested<Tys[0], Tys[1], Tys[2]>
        : any
      : any;
  }
}
