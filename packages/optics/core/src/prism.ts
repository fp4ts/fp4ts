// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow } from '@fp4ts/core';
import {
  Applicative,
  Either,
  Function1F,
  Identity,
  Left,
  Option,
  Right,
  Tagged,
} from '@fp4ts/cats';
import { ProfunctorChoice } from '@fp4ts/optics-kernel';
import { Indexable } from './indexable';
import { POptic } from './optics';

export type PPrism<S, T, A, B> = <F, P>(
  F: Applicative<F>,
  P: ProfunctorChoice<P>,
  Q: Indexable<Function1F, unknown>,
) => POptic<F, P, S, T, A, B>;
export type Prism<S, A> = PPrism<S, S, A, A>;

export function Prism<S, T, A, B>(
  getOrModify: (s: S) => Either<T, A>,
  reverseGet: (t: B) => T,
): PPrism<S, T, A, B> {
  return <F, P>(
    F: Applicative<F>,
    P: ProfunctorChoice<P>,
  ): POptic<F, P, S, T, A, B> =>
    flow(
      P.right<T>(),
      P.dimap(getOrModify, ea => ea.fold(F.pure, F.map(reverseGet))),
    );
}

export function Prism_<S, A>(
  getOptional: (s: S) => Option<A>,
  reverseGet: (t: A) => S,
): Prism<S, A> {
  return Prism(
    s =>
      getOptional(s).fold(
        () => Left(s),
        a => Right(a),
      ),
    reverseGet,
  );
}

export function reverseGet<S, T, A, B>(l: PPrism<S, T, A, B>): (b: B) => T {
  return flow(
    Tagged,
    l(Identity.Applicative, ProfunctorChoice.Tagged, Indexable.Function1()),
    Tagged.unTag,
  );
}
