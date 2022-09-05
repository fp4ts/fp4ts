// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import {
  $type,
  Kind,
  KindOf,
  Lazy,
  lazyVal,
  newtypeK,
  throwError,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Align } from '../align';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { Contravariant } from '../contravariant';
import { EqK } from '../eq-k';
import { Eval } from '../eval';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { StackSafeMonad } from '../stack-safe-monad';
import { Function0F } from './function';
import { Ior } from './ior';

const _Proxy = newtypeK<Function0F>()('@fp4ts/cats/core/proxy');
type _ProxyF = KindOf<typeof _Proxy>;

export type Proxy<A> = Kind<_ProxyF, [A]>;
export const Proxy: ProxyObj = function () {
  return _Proxy(() => throwError(new Error('Proxy does not have any values')));
} as any;

interface ProxyObj {
  <A>(): Proxy<A>;

  Eq<A>(): Eq<Proxy<A>>;
  EqK: EqK<ProxyF>;
  Functor: Functor<ProxyF>;
  Contravariant: Contravariant<ProxyF>;
  Applicative: Applicative<ProxyF>;
  Align: Align<ProxyF>;
  Alternative: Alternative<ProxyF>;
  Monad: Monad<ProxyF>;
}

// -- Instances

const proxyEq: <A>() => Eq<Proxy<A>> = lazyVal(() =>
  Eq.of({ equals: () => true }),
);
const proxyEqK: Lazy<EqK<ProxyF>> = lazyVal(() => EqK.of({ liftEq: proxyEq }));
const proxyFunctor: Lazy<Functor<ProxyF>> = lazyVal(() =>
  Functor.of({ map_: <A, B>() => Proxy<B>() }),
);
const proxyContravariant: Lazy<Contravariant<ProxyF>> = lazyVal(() =>
  Contravariant.of({ contramap_: <A, B>() => Proxy<B>() }),
);
const proxyApplicative: Lazy<Applicative<ProxyF>> = lazyVal(() =>
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
const proxyAlign: Lazy<Align<ProxyF>> = lazyVal(() =>
  Align.of({
    functor: proxyFunctor(),
    align_: <A, B>() => Proxy<Ior<A, B>>(),
  }),
);
const proxyAlternative: Lazy<Alternative<ProxyF>> = lazyVal(() =>
  Alternative.of({
    ...proxyApplicative(),
    emptyK: Proxy,
    combineK_: <A>() => Proxy<A>(),
  }),
);
const proxyMonad: Lazy<Monad<ProxyF>> = lazyVal(() =>
  StackSafeMonad.of({
    ...proxyApplicative(),
    flatMap_: <A, B>() => Proxy<B>(),
  }),
);

Proxy.Eq = proxyEq;
Object.defineProperty(Proxy, 'EqK', {
  get() {
    return proxyEqK();
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
Object.defineProperty(Proxy, 'Align', {
  get() {
    return proxyAlign();
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

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ProxyF extends TyK<[unknown]> {
  [$type]: Proxy<TyVar<this, 0>>;
}
