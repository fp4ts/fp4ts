// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Function1,
  Function1F,
  Profunctor,
  ProfunctorRequirements,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';
import { instance, Kind, Lazy, lazyVal } from '@fp4ts/core';

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

const function1Costrong: Lazy<Costrong<Function1F>> = lazyVal(() =>
  Costrong.of({
    unfirst:
      <A, B, C>(f: (ac: [A, C]) => [B, C]) =>
      (a: A) =>
        f([a, undefined as any as C])[0],
    unsecond:
      <A, B, C>(f: (ca: [C, A]) => [C, B]) =>
      (a: A) =>
        f([undefined as any as C, a])[1],
    ...Function1.ArrowChoice,
  }),
);

const taggedCostrong: Lazy<Costrong<TaggedF>> = lazyVal(() =>
  Costrong.of({
    unfirst: <A, B, C>(f: Tagged<[A, C], [B, C]>) =>
      Tagged<A, B>(Tagged.unTag(f)[0]),
    unsecond: <A, B, C>(f: Tagged<[C, A], [C, B]>) =>
      Tagged<A, B>(Tagged.unTag(f)[1]),
    ...Tagged.Profunctor,
  }),
);
