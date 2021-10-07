import { Eq } from '../../eq';
import { Semigroup } from '../../semigroup';
import { Monad } from '../../monad';

import { equals_, flatMap_, tailRecM_ } from './operators';
import { Ior } from './algebra';
import { IorK } from './ior';
import { $ } from '@cats4ts/core';
import { right } from './constructors';

export const iorEq: <A, B>(EqA: Eq<A>, EqB: Eq<B>) => Eq<Ior<A, B>> = (
  EqA,
  EqB,
) => Eq.of({ equals: equals_(EqA, EqB) });

export const iorMonad: <A>(S: Semigroup<A>) => Monad<$<IorK, [A]>> = S =>
  Monad.of({ pure: right, flatMap_: flatMap_(S), tailRecM_: tailRecM_(S) });
