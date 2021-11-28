// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, Lazy, lazyVal, tailrec, α, λ } from '@fp4ts/core';
import { Contravariant } from '../../contravariant';
import { ArrowChoice } from '../../arrow';
import { Monad } from '../../monad';
import { Either, Left, Right } from '../either';

import type { AndThen, AndThenK } from './and-then';
import { identity, lift, pure } from './constructors';
import { compose_ } from './operators';

export const andThenContravariant: <B>() => Contravariant<
  λ<AndThenK, [α, Fix<B>]>
> = () => Contravariant.of({ contramap_: (fa, f) => compose_(fa, f) });

export const andThenMonad: <A>() => Monad<$<AndThenK, [A]>> = <A>() =>
  Monad.of<$<AndThenK, [A]>>({
    pure: pure,
    flatMap_: (fa, f) => lift(x => f(fa(x))(x)),
    tailRecM_: <S, X>(
      s: S,
      f: (s: S) => AndThen<A, Either<S, X>>,
    ): AndThen<A, X> =>
      lift((a: A): X => {
        const step = tailrec(
          (curS: S): X =>
            f(curS)(a).fold(
              nextS => step(nextS),
              res => res,
            ),
        );
        return step(s);
      }),
  });

export const andThenArrowChoice: Lazy<ArrowChoice<AndThenK>> = lazyVal(() =>
  ArrowChoice.of({
    choose: <A, B, C, D>(f: AndThen<A, C>, g: AndThen<B, D>) =>
      lift((ea: Either<A, B>) =>
        ea.fold<Either<C, D>>(
          a => Left(f(a)),
          b => Right(g(b)),
        ),
      ),

    lift,

    first: <A, B, C>(fa: AndThen<A, B>): AndThen<[A, C], [B, C]> =>
      lift(([a, c]) => [fa(a), c]),

    id: identity,

    compose_: compose_,
  }),
);
