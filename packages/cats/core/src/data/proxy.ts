// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Eval, Kind, Lazy, lazy, TyK, TyVar } from '@fp4ts/core';
import { CommutativeMonoid, Compare, Eq, Ord } from '@fp4ts/cats-kernel';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { Contravariant } from '../contravariant';
import { EqK } from '../eq-k';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { MonoidK } from '../monoid-k';
import { StackSafeMonad } from '../stack-safe-monad';
import { Ior } from './ior';
import { Unzip } from '../unzip';
import { Unalign } from '../unalign';
import { TraversableFilter } from '../traversable-filter';
import { Option } from './option';

const tag = Symbol('@fp4ts/cats/core/data/proxy');
export interface Proxy<A> {
  [tag]: A;
}

const _Proxy: Proxy<any> = { [tag]: undefined };
export const Proxy: ProxyObj = function () {
  return _Proxy;
} as any;

interface ProxyObj {
  <A>(): Proxy<A>;

  Eq<A>(): Eq<Proxy<A>>;
  EqK: EqK<ProxyF>;
  Ord<A>(): Ord<Proxy<A>>;
  CommutativeMonoid<A>(): CommutativeMonoid<Proxy<A>>;
  MonoidK: MonoidK<ProxyF>;
  Functor: Functor<ProxyF>;
  Contravariant: Contravariant<ProxyF>;
  Applicative: Applicative<ProxyF>;
  Alternative: Alternative<ProxyF>;
  Monad: Monad<ProxyF>;
  Unalign: Unalign<ProxyF>;
  Unzip: Unzip<ProxyF>;
  TraversableFilter: TraversableFilter<ProxyF>;
}

// -- Instances

const proxyEq: <A>() => Eq<Proxy<A>> = lazy(() =>
  Eq.of({ equals: (x, y) => true }),
);
const proxyEqK: Lazy<EqK<ProxyF>> = lazy(() => EqK.of({ liftEq: proxyEq }));
const proxyOrd: <A>() => Ord<Proxy<A>> = lazy(() =>
  Ord.of({ compare: (x, y) => Compare.EQ }),
);
const proxyCommutativeMonoid = lazy(<A>() =>
  CommutativeMonoid.of<Proxy<A>>({
    empty: Proxy<A>(),
    combine_: (x, y) => Proxy<A>(),
    combineEval_: (x, ey) => Eval.now(Proxy<A>()),
  }),
) as <A>() => CommutativeMonoid<Proxy<A>>;
const proxyMonoidK: Lazy<MonoidK<ProxyF>> = lazy(() => {
  const M = proxyCommutativeMonoid<any>();
  const self: MonoidK<ProxyF> = MonoidK.of({
    emptyK: Proxy,
    combineK_: M.combine_,
    combineKEval_: M.combineEval_,
    algebra: () => M,
    dual: () => self,
  });
  return self;
});
const proxyFunctor: Lazy<Functor<ProxyF>> = lazy(() =>
  Functor.of({ map_: <A, B>() => Proxy<B>() }),
);
const proxyContravariant: Lazy<Contravariant<ProxyF>> = lazy(() =>
  Contravariant.of({ contramap_: <A, B>() => Proxy<B>() }),
);
const proxyApplicative: Lazy<Applicative<ProxyF>> = lazy(() =>
  Applicative.of({
    ...proxyFunctor(),
    pure: <A>() => Proxy<A>(),
    ap_: <A, B>() => Proxy<B>(),
    map2Eval_:
      () =>
      <C>() =>
        Eval.now(Proxy<C>()),
  }),
);
const proxyUnalign: Lazy<Unalign<ProxyF>> = lazy(() =>
  Unalign.of({
    ...proxyFunctor(),
    align_: <A, B>() => Proxy<Ior<A, B>>(),
    unalign: <A, B>(fa: Proxy<Ior<A, B>>) => [Proxy<A>(), Proxy<B>()],
  }),
);
const proxyUnzip: Lazy<Unzip<ProxyF>> = lazy(() =>
  Unzip.of({
    ...proxyFunctor(),
    unzipWith_: <A, B, C>(ab: Proxy<A>, f: (a: A) => readonly [B, C]) => [
      Proxy<B>(),
      Proxy<C>(),
    ],
    zipWith_: <A, B, C>(a: Proxy<A>, b: Proxy<B>, f: (a: A, b: B) => C) =>
      Proxy<C>(),
  }),
);
const proxyAlternative: Lazy<Alternative<ProxyF>> = lazy(() =>
  Alternative.of({
    ...proxyApplicative(),
    ...proxyMonoidK(),
  }),
);
const proxyMonad: Lazy<Monad<ProxyF>> = lazy(() =>
  StackSafeMonad.of({
    ...proxyApplicative(),
    flatMap_: <A, B>() => Proxy<B>(),
  }),
);

const proxyTraversableFilter: Lazy<TraversableFilter<ProxyF>> = lazy(() =>
  TraversableFilter.of<ProxyF>({
    ...proxyFunctor(),
    traverseFilter_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Proxy<A>, f: (a: A) => Kind<G, [Option<B>]>) =>
        G.pure(Proxy<B>()),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Proxy<A>, f: (a: A) => Kind<G, [B]>) =>
        G.pure(Proxy<B>()),
    sequence:
      <G>(G: Applicative<G>) =>
      <A>(fa: Proxy<Kind<G, [A]>>) =>
        G.pure(Proxy<A>()),
  }),
);

Proxy.Eq = proxyEq;
Object.defineProperty(Proxy, 'EqK', {
  get() {
    return proxyEqK();
  },
});
Proxy.Ord = proxyOrd;
Proxy.CommutativeMonoid = proxyCommutativeMonoid;
Object.defineProperty(Proxy, 'MonoidK', {
  get() {
    return proxyMonoidK();
  },
});
Object.defineProperty(Proxy, 'Functor', {
  get() {
    return proxyFunctor();
  },
});
Object.defineProperty(Proxy, 'Contravariant', {
  get() {
    return proxyContravariant();
  },
});
Object.defineProperty(Proxy, 'Applicative', {
  get() {
    return proxyApplicative();
  },
});
Object.defineProperty(Proxy, 'Unalign', {
  get() {
    return proxyUnalign();
  },
});
Object.defineProperty(Proxy, 'Alternative', {
  get() {
    return proxyAlternative();
  },
});
Object.defineProperty(Proxy, 'Monad', {
  get() {
    return proxyMonad();
  },
});
Object.defineProperty(Proxy, 'Unzip', {
  get() {
    return proxyUnzip();
  },
});
Object.defineProperty(Proxy, 'TraversableFilter', {
  get() {
    return proxyTraversableFilter();
  },
});

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ProxyF extends TyK<[unknown]> {
  [$type]: Proxy<TyVar<this, 0>>;
}
