// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind, Lazy, lazyVal, pipe } from '@fp4ts/core';
import {
  Either,
  Function1,
  Function1F,
  Left,
  Profunctor,
  ProfunctorRequirements,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';

export interface ProfunctorChoice<P> extends Profunctor<P> {
  left<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<A, C>, Either<B, C>]>;
  right<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<C, A>, Either<C, B>]>;
}

export type ProfunctorChoiceRequirements<P> = Pick<
  ProfunctorChoice<P>,
  'left'
> &
  ProfunctorRequirements<P> &
  Partial<ProfunctorChoice<P>>;
export const ProfunctorChoice = Object.freeze({
  of: <P>(P: ProfunctorChoiceRequirements<P>): ProfunctorChoice<P> => {
    const self: ProfunctorChoice<P> = instance<ProfunctorChoice<P>>({
      ...Profunctor.of(P),

      right:
        <C>() =>
        <A, B>(pab: Kind<P, [A, B]>): Kind<P, [Either<C, A>, Either<C, B>]> =>
          pipe(
            pab,
            self.left<C>(),
            self.dimap(
              ea => ea.swapped,
              ea => ea.swapped,
            ),
          ),

      ...P,
    });
    return self;
  },

  get Function1(): ProfunctorChoice<Function1F> {
    return Function1.ArrowChoice;
  },

  get Tagged(): ProfunctorChoice<TaggedF> {
    return taggedProfunctorChoice();
  },
});

// -- Instances

const taggedProfunctorChoice: Lazy<ProfunctorChoice<TaggedF>> = lazyVal(() =>
  ProfunctorChoice.of({
    ...Tagged.Profunctor,
    left:
      <C>() =>
      <A, B>(tab: Tagged<A, B>): Tagged<Either<A, C>, Either<B, C>> =>
        tab.map(Left).retag(),
  }),
);
