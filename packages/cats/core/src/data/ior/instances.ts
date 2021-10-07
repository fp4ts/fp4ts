import { $, Lazy } from '@cats4ts/core';
import { Eq } from '../../eq';
import { Semigroup } from '../../semigroup';
import { Monad } from '../../monad';
import { Bifunctor } from '../../bifunctor';

import {
  bimap_,
  equals_,
  flatMap_,
  map_,
  tailRecM_,
  leftMap_,
} from './operators';
import { Ior } from './algebra';
import { IorK } from './ior';
import { right } from './constructors';

export const iorEq: <A, B>(EqA: Eq<A>, EqB: Eq<B>) => Eq<Ior<A, B>> = (
  EqA,
  EqB,
) => Eq.of({ equals: equals_(EqA, EqB) });

export const iorMonad: <A>(S: Semigroup<A>) => Monad<$<IorK, [A]>> = S =>
  Monad.of({ pure: right, flatMap_: flatMap_(S), tailRecM_: tailRecM_(S) });

export const iorBifunctor: Lazy<Bifunctor<IorK>> = () =>
  Bifunctor.of({ bimap_: bimap_, map_: map_, leftMap_: leftMap_ });
