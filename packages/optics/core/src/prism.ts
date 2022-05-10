// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow } from '@fp4ts/core';
import { Applicative, Either, Functor, Left, Option, Right } from '@fp4ts/cats';
import { Choice } from '@fp4ts/optics-kernel';
import { Indexable } from './indexable';
import { POptic } from './optics';

export type PPrism<S, T, A, B> = <F, P>(
  F: Applicative<F>,
  P: Choice<P>,
) => POptic<F, P, S, T, A, B>;
export type Prism<S, A> = PPrism<S, S, A, A>;

export function Prism<S, T, A, B>(
  getOrModify: (s: S) => Either<T, A>,
  reverseGet: (t: B) => T,
): PPrism<S, T, A, B> {
  return <F, P>(F: Applicative<F>, P: Choice<P>): POptic<F, P, S, T, A, B> =>
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

export function getOrModify<S, T, A, B>(
  l: PPrism<S, T, A, B>,
): (s: S) => Either<T, A> {
  return flow(
    l(Either.Applicative<A>(), Indexable.Function1())(Left),
    at => at.swapped,
  );
}

export function getOption<S, T, A, B>(
  l: PPrism<S, T, A, B>,
): (s: S) => Option<A> {
  return flow(
    l(Either.Applicative<A>(), Indexable.Function1())(Left),
    at => at.swapped.toOption,
  );
}
