// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, id, instance, Kind, Lazy, lazyVal } from '@fp4ts/core';
import {
  Function1,
  Function1F,
  Functor,
  Identity,
  IdentityF,
  Kleisli,
  KleisliF,
  Monad,
  Profunctor,
  ProfunctorRequirements,
  Proxy,
  ProxyF,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';

export interface Sieve<P, F> extends Profunctor<P> {
  readonly F: Functor<F>;

  sieve<A, B>(pab: Kind<P, [A, B]>): (a: A) => Kind<F, [B]>;
}

export type SieveRequirements<P, F> = Pick<Sieve<P, F>, 'sieve'> &
  ProfunctorRequirements<P> &
  Partial<Sieve<P, F>>;
export const Sieve = Object.freeze({
  of: <F, P>(P: SieveRequirements<P, F>, F: Functor<F>): Sieve<P, F> =>
    instance<Sieve<P, F>>({
      F,
      ...Profunctor.of(P),
      ...P,
    }),

  get Function1(): Sieve<Function1F, IdentityF> {
    return function1Sieve();
  },

  Kleisli: <F>(F: Monad<F>): Sieve<$<KleisliF, [F]>, F> =>
    Sieve.of(
      { sieve: <A, B>(pab: Kleisli<F, A, B>) => pab, ...Kleisli.Arrow(F) },
      F,
    ),
});

export interface Cosieve<P, F> extends Profunctor<P> {
  readonly C: Functor<F>;

  cosieve<A, B>(pab: Kind<P, [A, B]>): (fa: Kind<F, [A]>) => B;
}

export type CosieveRequirements<P, F> = Pick<Cosieve<P, F>, 'cosieve'> &
  ProfunctorRequirements<P> &
  Partial<Cosieve<P, F>>;
export const Cosieve = Object.freeze({
  of: <P, F>(P: CosieveRequirements<P, F>, C: Functor<F>): Cosieve<P, F> =>
    instance<Cosieve<P, F>>({
      C,
      ...Profunctor.of(P),
      ...P,
    }),

  get Function1(): Cosieve<Function1F, IdentityF> {
    return function1Cosieve();
  },

  get Tagged(): Cosieve<TaggedF, ProxyF> {
    return taggedCosieve();
  },
});

// -- Instances

const function1Sieve: Lazy<Sieve<Function1F, IdentityF>> = lazyVal(() =>
  Sieve.of({ sieve: id, ...Function1.ArrowChoice }, Identity.Functor),
);

const function1Cosieve: Lazy<Cosieve<Function1F, IdentityF>> = lazyVal(() =>
  Cosieve.of({ cosieve: id, ...Function1.ArrowChoice }, Identity.Functor),
);

const taggedCosieve: Lazy<Cosieve<TaggedF, ProxyF>> = lazyVal(() =>
  Cosieve.of(
    {
      cosieve:
        <A, B>(pab: Tagged<A, B>) =>
        (p: Proxy<A>) =>
          Tagged.unTag(pab),
      ...Tagged.Profunctor,
    },
    Proxy.Functor,
  ),
);
