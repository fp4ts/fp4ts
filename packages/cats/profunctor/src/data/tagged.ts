// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, lazy, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Bifunctor, EqK, Monad } from '@fp4ts/cats-core';
import {
  Identity,
  Left,
  Proxy,
  ProxyF,
  Right,
} from '@fp4ts/cats-core/lib/data';
import { Choice } from '../choice';
import { Closed } from '../closed';
import { Cosieve } from '../sieve';
import { Costrong } from '../strong';
import { Profunctor } from '../profunctor';
import { Corepresentable } from '../representable';

/**
 * `Tagged<S, B>` is a value `B` with phantom type `S`.
 */
export type Tagged<S, B> = B;
export const Tagged = function <S, B>(b: B): Tagged<S, B> {
  return b;
};

Tagged.Eq = <S, A>(E: Eq<A>): Eq<Tagged<S, A>> => E;

Tagged.EqK = lazy(
  <S>(): EqK<$<TaggedF, [S]>> => EqK.of({ liftEq: Tagged.Eq }),
) as <S>() => EqK<$<TaggedF, [S]>>;

Tagged.Monad = lazy(<S>(): Monad<$<TaggedF, [S]>> => Identity.Monad as any) as <
  S,
>() => Monad<$<TaggedF, [S]>>;

Tagged.Bifunctor = null as any as Bifunctor<TaggedF>;
Tagged.Profunctor = null as any as Profunctor<TaggedF>;
Tagged.Closed = null as any as Closed<TaggedF>;
Tagged.Costrong = null as any as Costrong<TaggedF>;
Tagged.Choice = null as any as Choice<TaggedF>;
Tagged.Cosieve = null as any as Cosieve<TaggedF, ProxyF>;
Tagged.Corepresentable = null as any as Corepresentable<TaggedF, ProxyF>;

const taggedBifunctor = lazy(() =>
  Bifunctor.of<TaggedF>({ bimap_: (b, f, g) => g(b) }),
);

const taggedProfunctor = lazy(() =>
  Profunctor.of<TaggedF>({
    dimap_: (b, f, g) => g(b),
    lmap_: (b, f) => b,
    rmap_: (b, g) => g(b),
  }),
);

const taggedClosed = lazy(() =>
  Closed.of<TaggedF>({
    ...taggedProfunctor(),
    closed:
      <X>() =>
      <B>(b: B) =>
      (_: X) =>
        b,
  }),
);

const taggedCostrong = lazy(() =>
  Costrong.of<TaggedF>({
    ...taggedProfunctor(),
    unfirst: bc => bc[0],
    unsecond: bc => bc[1],
  }),
);

const taggedChoice = lazy(() =>
  Choice.of<TaggedF>({
    ...taggedProfunctor(),
    left: <C>() => Left,
    right: <C>() => Right,
  }),
);

const taggedCosieve = lazy(() =>
  Cosieve.of<TaggedF, ProxyF>({
    ...taggedProfunctor(),
    C: Proxy.Functor,
    cosieve:
      <A, B>(b: B) =>
      (p: Proxy<A>): B =>
        b,
  }),
);

const taggedCorepresentable = lazy(() =>
  Corepresentable.of<TaggedF, ProxyF>({
    ...taggedCosieve(),
    ...taggedCostrong(),
    cotabulate: f => f(Proxy()),
  }),
);

Object.defineProperty(Tagged, 'Bifunctor', {
  get() {
    return taggedBifunctor();
  },
});
Object.defineProperty(Tagged, 'Profunctor', {
  get() {
    return taggedProfunctor();
  },
});
Object.defineProperty(Tagged, 'Closed', {
  get() {
    return taggedClosed();
  },
});
Object.defineProperty(Tagged, 'Costrong', {
  get() {
    return taggedCostrong();
  },
});
Object.defineProperty(Tagged, 'Choice', {
  get() {
    return taggedChoice();
  },
});
Object.defineProperty(Tagged, 'Cosieve', {
  get() {
    return taggedCosieve();
  },
});
Object.defineProperty(Tagged, 'Corepresentable', {
  get() {
    return taggedCorepresentable();
  },
});

// -- HKT

export interface TaggedF extends TyK<[unknown, unknown]> {
  [$type]: Tagged<TyVar<this, 0>, TyVar<this, 1>>;
}
