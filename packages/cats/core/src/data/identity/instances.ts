// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, Lazy, lazyVal } from '@fp4ts/core';
import { Eval } from '../../eval';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { IdentityK } from './identity';
import { flatMap_, map_, tailRecM_ } from './operators';
import { pure, unit } from './constructors';
import { Identity } from './identity';

export const identityFunctor: Lazy<Functor<IdentityK>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const identityApply: Lazy<Apply<IdentityK>> = lazyVal(() =>
  Apply.of({
    ...identityFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const identityApplicative: Lazy<Applicative<IdentityK>> = lazyVal(() =>
  Applicative.of({
    ...identityApply(),
    pure: pure,
    unit: unit,
  }),
);

export const identityFlatMap: Lazy<FlatMap<IdentityK>> = lazyVal(() =>
  FlatMap.of({ ...identityApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const identityMonad: Lazy<Monad<IdentityK>> = lazyVal(() =>
  Monad.of({
    ...identityApplicative(),
    ...identityFlatMap(),
  }),
);

export const identityFoldable: Lazy<Foldable<IdentityK>> = lazyVal(() =>
  Foldable.of({
    foldLeft_: (fa, b, f) => f(b, fa),
    foldRight_: (fa, eb, f) => Eval.defer(() => f(fa, eb)),
  }),
);

export const identityTraversable: Lazy<Traversable<IdentityK>> = lazyVal(() =>
  Traversable.of({
    ...identityFoldable(),
    ...identityFunctor(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Identity<A>, f: (a: A) => Kind<G, [B]>) =>
        f(fa),
  }),
);
