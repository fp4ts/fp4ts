// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $type,
  Eval,
  EvalF,
  id,
  Kind,
  Lazy,
  lazy,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { EqK } from '../eq-k';
import { Distributive } from '../distributive';
import { Applicative } from '../applicative';
import { Apply } from '../apply';
import { FlatMap } from '../flat-map';
import { CoflatMap } from '../coflat-map';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { Comonad } from '../comonad';
import { Foldable } from '../foldable';
import { Traversable } from '../traversable';
import { Unzip } from '../unzip';

import { Either } from './either';

export type Identity<A> = A;

export const Identity: IdentityObj = function <A>(a: A): Identity<A> {
  return a;
} as any;

interface IdentityObj {
  <A>(a: A): Identity<A>;

  readonly EqK: EqK<IdentityF>;
  readonly Functor: Functor<IdentityF>;
  readonly Distributive: Distributive<IdentityF>;
  readonly Apply: Apply<IdentityF>;
  readonly Applicative: Applicative<IdentityF>;
  readonly FlatMap: FlatMap<IdentityF>;
  readonly CoflatMap: CoflatMap<IdentityF>;
  readonly Monad: Monad<IdentityF>;
  readonly Comonad: Comonad<IdentityF>;
  readonly Foldable: Foldable<IdentityF>;
  readonly Traversable: Traversable<IdentityF>;
  readonly Unzip: Unzip<IdentityF>;
}

const IdentitySymbol = Symbol('@fp4ts/cats/core/data/Identity');
export function isIdentityTC(
  TC: Traversable<any>,
): TC is Traversable<IdentityF>;
export function isIdentityTC(TC: Foldable<any>): TC is Foldable<IdentityF>;
export function isIdentityTC(TC: Monad<any>): TC is Monad<IdentityF>;
export function isIdentityTC(
  TC: Applicative<any>,
): TC is Applicative<IdentityF>;
export function isIdentityTC(TC: FlatMap<any>): TC is FlatMap<IdentityF>;
export function isIdentityTC(TC: Apply<any>): TC is Apply<IdentityF>;
export function isIdentityTC(TC: Functor<any>): TC is Functor<IdentityF>;
export function isIdentityTC(
  TC: Functor<any> | Foldable<any>,
): TC is Functor<IdentityF> | Foldable<IdentityF> {
  return IdentitySymbol in TC;
}

// -- Instances

Object.defineProperty(Identity, 'EqK', {
  get(): EqK<IdentityF> {
    return identityEqK();
  },
});
Object.defineProperty(Identity, 'Functor', {
  get(): Functor<IdentityF> {
    return identityFunctor();
  },
});
Object.defineProperty(Identity, 'Distributive', {
  get(): Distributive<IdentityF> {
    return identityDistributive();
  },
});
Object.defineProperty(Identity, 'Apply', {
  get(): Apply<IdentityF> {
    return identityApply();
  },
});
Object.defineProperty(Identity, 'Applicative', {
  get(): Applicative<IdentityF> {
    return identityApplicative();
  },
});
Object.defineProperty(Identity, 'FlatMap', {
  get(): FlatMap<IdentityF> {
    return identityFlatMap();
  },
});
Object.defineProperty(Identity, 'CoflatMap', {
  get(): CoflatMap<IdentityF> {
    return identityCoflatMap();
  },
});
Object.defineProperty(Identity, 'Monad', {
  get(): Monad<IdentityF> {
    return identityMonad();
  },
});
Object.defineProperty(Identity, 'Comonad', {
  get(): Comonad<IdentityF> {
    return identityComonad();
  },
});
Object.defineProperty(Identity, 'Foldable', {
  get(): Foldable<IdentityF> {
    return identityFoldable();
  },
});
Object.defineProperty(Identity, 'Traversable', {
  get(): Traversable<IdentityF> {
    return identityTraversable();
  },
});
Object.defineProperty(Identity, 'Unzip', {
  get(): Unzip<IdentityF> {
    return identityUnzip();
  },
});

const identityEqK: Lazy<EqK<IdentityF>> = lazy(() => EqK.of({ liftEq: id }));

const identityFunctor: Lazy<Functor<IdentityF>> = lazy(() => ({
  [IdentitySymbol]: true,
  ...Functor.of({ map_: (fa, f) => f(fa) }),
}));

const identityDistributive: Lazy<Distributive<IdentityF>> = lazy(() =>
  Distributive.of<IdentityF>({
    ...identityFunctor(),
    distribute_: G => G.map_,
  }),
);

const identityApply: Lazy<Apply<IdentityF>> = lazy(() =>
  Apply.of({
    ...identityFunctor(),
    ap_: (ff, fa) => ff(fa),
    map2_: (a, b, f) => f(a, b),

    TraverseStrategy: use =>
      use<EvalF>({
        toRhs: Eval.always,
        defer: Eval.defer,
        toG: e => e.value,
        map: (fa, f) => fa.map(f),
        map2: (fa, fb, f) => fa.map2(fb, f),
        cosequenceEval: xs => Eval.always(() => xs.flatten()),
      }),
  }),
);

const identityApplicative: Lazy<Applicative<IdentityF>> = lazy(() =>
  Applicative.of({ ...identityApply(), pure: id, unit: undefined }),
);

const identityFlatMap: Lazy<FlatMap<IdentityF>> = lazy(() =>
  FlatMap.of({
    ...identityApply(),
    flatMap_: (fa, f) => f(fa),
    tailRecM_: <A, B>(
      a: A,
      f: (a: A) => Identity<Either<A, B>>,
    ): Identity<B> => {
      let cur: Either<A, B> = f(a);

      while (cur.isEmpty) {
        cur = f(cur.getLeft);
      }

      return cur.get;
    },
  }),
);

const identityCoflatMap: Lazy<CoflatMap<IdentityF>> = lazy(() =>
  CoflatMap.of({
    ...identityFunctor(),
    coflatMap_: (fa, f) => f(fa),
    coflatten: id,
  }),
);

const identityMonad: Lazy<Monad<IdentityF>> = lazy(() =>
  Monad.of({
    ...identityApplicative(),
    ...identityFlatMap(),
  }),
);

const identityComonad: Lazy<Comonad<IdentityF>> = lazy(() =>
  Comonad.of({ ...identityCoflatMap(), extract: id }),
);

const identityFoldable: Lazy<Foldable<IdentityF>> = lazy(() => ({
  [IdentitySymbol]: true,
  ...Foldable.of({
    foldRight_: (fa, ez, f) => Eval.defer(() => f(fa, ez)),
  }),
}));

const identityTraversable: Lazy<Traversable<IdentityF>> = lazy(() =>
  Traversable.of({
    ...identityFoldable(),
    ...identityFunctor(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Identity<A>, f: (a: A) => Kind<G, [B]>) =>
        f(fa),
  }),
);

const identityUnzip: Lazy<Unzip<IdentityF>> = lazy(() =>
  Unzip.of({
    ...identityFunctor(),
    zip_: (fa, fb) => [fa, fb],
    zipWith_: (fa, fb, f) => f(fa, fb),
    unzip: ([a, b]) => [a, b],
    unzipWith_: (fa, f) => [...f(fa)],
  }),
);

// HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface IdentityF extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>;
}
