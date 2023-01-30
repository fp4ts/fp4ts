// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  coerce,
  compose,
  flow,
  instance,
  Kind,
  Lazy,
  lazy,
} from '@fp4ts/core';
import {
  Distributive,
  Function1,
  Function1F,
  Kleisli,
  KleisliF,
  Monad,
  Profunctor,
  ProfunctorRequirements,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';

export interface Closed<P> extends Profunctor<P> {
  closed<X>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [(x: X) => A, (x: X) => B]>;
}

export type ClosedRequirements<P> = Pick<Closed<P>, 'closed'> &
  ProfunctorRequirements<P> &
  Partial<Closed<P>>;
export const Closed = Object.freeze({
  of: <P>(P: ClosedRequirements<P>): Closed<P> =>
    instance<Closed<P>>({
      ...Profunctor.of(P),
      ...P,
    }),

  get Function1(): Closed<Function1F> {
    return closedFunction1();
  },

  get Tagged(): Closed<TaggedF> {
    return closedTagged();
  },

  Kleisli: <F>(F: Distributive<F> & Monad<F>): Closed<$<KleisliF, [F]>> =>
    Closed.of({
      closed:
        <X>() =>
        <A, B>(pab: Kleisli<F, A, B>): Kleisli<F, (x: X) => A, (x: X) => B> =>
          Kleisli(xa =>
            F.consequence(Function1.Functor<X>())(compose(pab, xa)),
          ),
      ...Kleisli.Arrow(F),
    }),
});

const closedFunction1: Lazy<Closed<Function1F>> = lazy(() =>
  Closed.of<Function1F>({
    closed:
      <X>() =>
      <A, B>(pab: (a: A) => B) =>
      (xa: (x: X) => A): ((x: X) => B) =>
        flow(xa, pab),
    ...Function1.ArrowChoice,
  }),
);

const closedTagged: Lazy<Closed<TaggedF>> = lazy(() =>
  Closed.of<TaggedF>({
    closed:
      <X>() =>
      <A, B>(pab: Tagged<A, B>): Tagged<(x: X) => A, (x: X) => B> =>
        Tagged(() => coerce(pab)),

    ...Tagged.Profunctor,
  }),
);
