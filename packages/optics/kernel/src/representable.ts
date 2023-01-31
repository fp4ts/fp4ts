// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, id, instance, Kind, Lazy, lazy } from '@fp4ts/core';
import {
  ArrowChoice,
  Function1F,
  Functor,
  Identity,
  IdentityF,
  Kleisli,
  KleisliF,
  Monad,
  Proxy,
  ProxyF,
  Strong,
  StrongRequirements,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';
import { Costrong, CostrongRequirements } from './costrong';
import {
  Cosieve,
  CosieveRequirements,
  Sieve,
  SieveRequirements,
} from './sieve';

export interface Representable<P, RepF> extends Sieve<P, RepF>, Strong<P> {
  tabulate<D, C>(f: (d: D) => Kind<RepF, [C]>): Kind<P, [D, C]>;
}

export type RepresentableRequirements<P, RepF> = Pick<
  Representable<P, RepF>,
  'tabulate'
> &
  SieveRequirements<P, RepF> &
  StrongRequirements<P> &
  Partial<Representable<P, RepF>>;
export const Representable = Object.freeze({
  of: <P, RepF>(
    P: RepresentableRequirements<P, RepF>,
    F: Functor<RepF>,
  ): Representable<P, RepF> =>
    instance<Representable<P, RepF>>({
      ...Strong.of(P),
      ...Sieve.of(P, F),
      ...P,
    }),

  get Function1(): Representable<Function1F, IdentityF> {
    return function1Representable();
  },

  Kleisli: <F>(F: Monad<F>): Representable<$<KleisliF, [F]>, F> =>
    Representable.of(
      {
        tabulate: Kleisli,
        ...Kleisli.Arrow(F),
        ...Sieve.Kleisli(F),
      },
      F,
    ),
});

export interface Corepresentable<P, CorepF>
  extends Cosieve<P, CorepF>,
    Costrong<P> {
  cotabulate<D, C>(f: (corep: Kind<CorepF, [D]>) => C): Kind<P, [D, C]>;
}

export type CorepresentableRequirements<P, CorepF> = Pick<
  Corepresentable<P, CorepF>,
  'cotabulate'
> &
  CostrongRequirements<P> &
  CosieveRequirements<P, CorepF> &
  Partial<Corepresentable<P, CorepF>>;
export const Corepresentable = Object.freeze({
  of: <P, CorepF>(
    P: CorepresentableRequirements<P, CorepF>,
    C: Functor<CorepF>,
  ): Corepresentable<P, CorepF> =>
    instance<Corepresentable<P, CorepF>>({
      ...Cosieve.of(P, C),
      ...Costrong.of(P),
      ...P,
    }),

  get Function1(): Corepresentable<Function1F, IdentityF> {
    return function1Corepresentable();
  },

  get Tagged(): Corepresentable<TaggedF, ProxyF> {
    return taggedCorepresentable();
  },
});

// -- Instances

const function1Representable: Lazy<Representable<Function1F, IdentityF>> = lazy(
  () =>
    Representable.of(
      {
        tabulate: id,
        ...Sieve.Function1,
        ...ArrowChoice.Function1,
      },
      Identity.Functor,
    ),
);

const function1Corepresentable: Lazy<Corepresentable<Function1F, IdentityF>> =
  lazy(() =>
    Corepresentable.of(
      {
        cotabulate: id,
        ...Cosieve.Function1,
        ...Costrong.Function1,
      },
      Identity.Functor,
    ),
  );

const taggedCorepresentable: Lazy<Corepresentable<TaggedF, ProxyF>> = lazy(() =>
  Corepresentable.of(
    {
      cotabulate: <D, C>(f: (corep: Proxy<D>) => C): Tagged<D, C> =>
        Tagged(f(Proxy<D>())),
      ...Cosieve.Tagged,
      ...Costrong.Tagged,
    },
    Proxy.Functor,
  ),
);
