// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind, Lazy, lazyVal } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { EqK } from '../../eq-k';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { FlatMap } from '../../flat-map';
import { CoflatMap } from '../../coflat-map';
import { Monad } from '../../monad';
import { Comonad } from '../../comonad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import type { IdentityF } from './identity';
import {
  coflatMap_,
  coflatten,
  extract,
  flatMap_,
  map_,
  tailRecM_,
} from './operators';
import { pure, unit } from './constructors';
import { Identity } from './identity';
import { Distributive } from '../../distributive';

export const identityEqK: Lazy<EqK<IdentityF>> = lazyVal(() =>
  EqK.of({ liftEq: id }),
);

export const identityFunctor: Lazy<Functor<IdentityF>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const identityDistributive: Lazy<Distributive<IdentityF>> = lazyVal(() =>
  Distributive.of<IdentityF>({
    ...identityFunctor(),
    distribute_: G => G.map_,
  }),
);

export const identityApply: Lazy<Apply<IdentityF>> = lazyVal(() =>
  Apply.of({
    ...identityFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const identityApplicative: Lazy<Applicative<IdentityF>> = lazyVal(() =>
  Applicative.of({
    ...identityApply(),
    pure: pure,
    unit: unit,
  }),
);

export const identityFlatMap: Lazy<FlatMap<IdentityF>> = lazyVal(() =>
  FlatMap.of({ ...identityApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const identityCoflatMap: Lazy<CoflatMap<IdentityF>> = lazyVal(() =>
  CoflatMap.of({
    ...identityFunctor(),
    coflatMap_: coflatMap_,
    coflatten: coflatten,
  }),
);

export const identityMonad: Lazy<Monad<IdentityF>> = lazyVal(() =>
  Monad.of({
    ...identityApplicative(),
    ...identityFlatMap(),
  }),
);

export const identityComonad: Lazy<Comonad<IdentityF>> = lazyVal(() =>
  Comonad.of({ ...identityCoflatMap(), extract: extract }),
);

export const identityFoldable: Lazy<Foldable<IdentityF>> = lazyVal(() =>
  Foldable.of({
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fa: A, f: (a: A) => M) =>
        f(fa),
  }),
);

export const identityTraversable: Lazy<Traversable<IdentityF>> = lazyVal(() =>
  Traversable.of({
    ...identityFoldable(),
    ...identityFunctor(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Identity<A>, f: (a: A) => Kind<G, [B]>) =>
        f(fa),
  }),
);
