import { Kind, $type, TyK, TyVar } from '@cats4ts/core';
import { Foldable } from '../../../foldable';
import { Eq } from '../../../eq';
import { Applicative } from '../../../applicative';
import { Vector } from '../vector';
import { List } from '../list';

import { Chain as ChainBase } from './algebra';
import {
  empty,
  fromArray,
  fromList,
  fromVector,
  of,
  pure,
  singleton,
} from './constructors';
import { traverseViaChain } from './operators';
import { chainEq } from './instances';

export type Chain<A> = ChainBase<A>;
export const Chain: ChainObj = function (...xs) {
  return fromArray(xs);
};

interface ChainObj {
  <A>(...xs: A[]): Chain<A>;
  pure<A>(x: A): Chain<A>;
  singleton<A>(x: A): Chain<A>;
  empty: Chain<never>;
  of<A>(...xs: A[]): Chain<A>;
  fromArray<A>(xs: A[]): Chain<A>;
  fromList<A>(xs: List<A>): Chain<A>;
  fromVector<A>(xs: Vector<A>): Chain<A>;
  traverseViaChain<G, F>(
    G: Applicative<G>,
    F: Foldable<F>,
  ): <A, B>(xs: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>) => Kind<G, [Chain<B>]>;

  // -- Instances
  Eq<A>(E: Eq<A>): Eq<Chain<A>>;
}

Chain.pure = pure;
Chain.singleton = singleton;
Chain.empty = empty;
Chain.of = of;
Chain.fromArray = fromArray;
Chain.fromList = fromList;
Chain.fromVector = fromVector;
Chain.traverseViaChain = traverseViaChain;

Chain.Eq = chainEq;

// HKT

export interface ChainK extends TyK<[unknown]> {
  [$type]: Chain<TyVar<this, 0>>;
}
