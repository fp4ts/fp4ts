// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind, Lazy, lazy, pipe } from '@fp4ts/core';
import {
  ArrowChoice,
  Either,
  Function1F,
  Left,
  Profunctor,
  ProfunctorRequirements,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';

export interface Choice<P> extends Profunctor<P> {
  left<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<A, C>, Either<B, C>]>;
  right<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<C, A>, Either<C, B>]>;
}

export type ChoiceRequirements<P> = Pick<Choice<P>, 'left'> &
  ProfunctorRequirements<P> &
  Partial<Choice<P>>;
export const Choice = Object.freeze({
  of: <P>(P: ChoiceRequirements<P>): Choice<P> => {
    const self: Choice<P> = instance<Choice<P>>({
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

  get Function1(): Choice<Function1F> {
    return ArrowChoice.Function1;
  },

  get Tagged(): Choice<TaggedF> {
    return taggedChoice();
  },
});

// -- Instances

const taggedChoice: Lazy<Choice<TaggedF>> = lazy(() =>
  Choice.of({
    ...Tagged.Profunctor,
    left:
      <C>() =>
      <A, B>(tab: Tagged<A, B>): Tagged<Either<A, C>, Either<B, C>> =>
        Tagged(Left(Tagged.unTag(tab))),
  }),
);
