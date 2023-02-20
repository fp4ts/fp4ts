// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind, Lazy, lazy } from '@fp4ts/core';
import {
  ArrowChoice,
  Function1F,
  Profunctor,
  ProfunctorRequirements,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';

export interface Costrong<P> extends Profunctor<P> {
  unfirst<A, B, C>(pacbc: Kind<P, [[A, C], [B, C]]>): Kind<P, [A, B]>;
  unsecond<A, B, C>(pcacb: Kind<P, [[C, A], [C, B]]>): Kind<P, [A, B]>;
}

export type CostrongRequirements<P> = Pick<
  Costrong<P>,
  'unfirst' | 'unsecond'
> &
  ProfunctorRequirements<P> &
  Partial<Costrong<P>>;
export const Costrong = Object.freeze({
  of: <P>(P: CostrongRequirements<P>): Costrong<P> =>
    instance<Costrong<P>>({
      ...Profunctor.of(P),
      ...P,
    }),

  get Function1(): Costrong<Function1F> {
    return function1Costrong();
  },
  get Tagged(): Costrong<TaggedF> {
    return taggedCostrong();
  },
});

// -- Instances

const function1Costrong: Lazy<Costrong<Function1F>> = lazy(() =>
  Costrong.of({
    unfirst:
      <A, B, C>(f: (ac: [A, C]) => [B, C]) =>
      (a: A) =>
        f([a, bottom])[0],
    unsecond:
      <A, B, C>(f: (ca: [C, A]) => [C, B]) =>
      (a: A) =>
        f([bottom, a])[1],
    ...ArrowChoice.Function1,
  }),
);

const taggedCostrong: Lazy<Costrong<TaggedF>> = lazy(() =>
  Costrong.of({
    unfirst: <A, B, C>(f: Tagged<[A, C], [B, C]>) => f[0],
    unsecond: <A, B, C>(f: Tagged<[C, A], [C, B]>) => f[1],
    ...Tagged.Profunctor,
  }),
);

const bottom = new Proxy(
  {
    valueOf() {
      while (true);
    },
  },
  {
    get() {
      while (true) {}
    },
    set() {
      while (true) {}
    },
    apply() {
      while (true) {}
    },
    ownKeys() {
      while (true) {}
    },
    construct() {
      while (true) {}
    },
    deleteProperty() {
      while (true) {}
    },
    has() {
      while (true) {}
    },
    getOwnPropertyDescriptor() {
      while (true) {}
    },
    getPrototypeOf() {
      while (true) {}
    },
    defineProperty() {
      while (true) {}
    },
  },
) as any as never;
