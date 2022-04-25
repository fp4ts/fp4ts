// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow } from '@fp4ts/core';
import {
  Applicative,
  Either,
  Function1,
  Identity,
  IdentityF,
  Left,
  Option,
  Right,
  Tagged,
  TaggedF,
} from '@fp4ts/cats';
import { Affine, ProfunctorChoice } from '@fp4ts/optics-kernel';
import { Optic, POptic } from './optics';
import { Getter, to } from './getter';

export type POptional<S, T, A, B> = <F, P>(
  F: Applicative<F>,
  P: Affine<P>,
) => POptic<F, P, S, T, A, B>;
export type Optional<S, A> = POptional<S, S, A, A>;

export function Optional<S, T, A, B>(
  getOrModify: (s: S) => Either<T, A>,
  replace: (b: B) => (s: S) => T,
): POptional<S, T, A, B> {
  return <F, P>(F: Applicative<F>, P: Affine<P>): POptic<F, P, S, T, A, B> =>
    flow(
      P.right<T>(),
      P.second<S>(),
      P.dimap(
        s => [s, getOrModify(s)],
        ([s, etfb]) =>
          etfb.fold(
            F.pure,
            F.map(b => replace(b)(s)),
          ),
      ),
    );
}

export function Optional_<S, A>(
  getOptional: (s: S) => Option<A>,
  replace: (a: A) => (s: S) => S,
): Optional<S, A> {
  return Optional(
    s =>
      getOptional(s).fold(
        () => Left(s),
        a => Right(a),
      ),
    replace,
  );
}

export function getOrModify<S, T, A, B>(
  l: POptional<S, T, A, B>,
): (s: S) => Either<T, A> {
  return flow(
    l(Either.Applicative<A>(), Function1.ArrowChoice)(Left),
    at => at.swapped,
  );
}

export function getOption<S, T, A, B>(
  l: POptional<S, T, A, B>,
): (s: S) => Option<A> {
  return flow(getOrModify(l), ea => ea.toOption);
}

export function re<T, B>(
  l: (
    F: Applicative<IdentityF>,
    P: ProfunctorChoice<TaggedF>,
  ) => Optic<IdentityF, TaggedF, T, B>,
): Getter<B, T> {
  return to(
    flow(
      Tagged,
      l(Identity.Applicative, ProfunctorChoice.Tagged),
      Tagged.unTag,
    ),
  );
}
