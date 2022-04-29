// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, Kind, Lazy, lazyVal, α, λ } from '@fp4ts/core';
import { Contravariant } from '../../contravariant';
import { ArrowChoice } from '../../arrow';
import { Monad } from '../../monad';
import { Either, Left, Right } from '../either';

import { AndThen, AndThenF } from './and-then';
import { identity, lift, pure } from './constructors';
import { compose_ } from './operators';
import { Distributive } from '../../distributive';
import { Functor } from '../../functor';

export const andThenContravariant: <B>() => Contravariant<
  λ<AndThenF, [α, Fix<B>]>
> = () => Contravariant.of({ contramap_: (fa, f) => compose_(fa, f) });

export const andThenFunctor = <R>(): Functor<$<AndThenF, [R]>> =>
  Functor.of({ map_: (fa, f) => fa.andThen(f) });

export const andThenDistributive = <R>(): Distributive<$<AndThenF, [R]>> =>
  Distributive.of({
    ...andThenFunctor(),
    distribute_:
      <G>(G: Functor<G>) =>
      <A, B>(ga: Kind<G, [A]>, f: (a: A) => AndThen<R, B>) =>
        lift(r => G.map_(ga, (a: A) => f(a)(r))),
  });

export const andThenMonad: <A>() => Monad<$<AndThenF, [A]>> = <A>() =>
  Monad.of<$<AndThenF, [A]>>({
    pure: pure,
    flatMap_: (fa, f) => lift(x => f(fa(x))(x)),
    tailRecM_: <S, X>(
      s: S,
      f: (s: S) => AndThen<A, Either<S, X>>,
    ): AndThen<A, X> =>
      lift((a: A): X => {
        let cur: Either<S, X> = f(s)(a);
        while (cur.isLeft) {
          cur = f(cur.getLeft)(a);
        }
        return cur.get;
      }),
  });

export const andThenArrowChoice: Lazy<ArrowChoice<AndThenF>> = lazyVal(() =>
  ArrowChoice.of({
    choose: <A, B, C, D>(f: AndThen<A, C>, g: AndThen<B, D>) =>
      lift((ea: Either<A, B>) =>
        ea.fold<Either<C, D>>(
          a => Left(f(a)),
          b => Right(g(b)),
        ),
      ),

    lift,

    first:
      <C>() =>
      <A, B>(fa: AndThen<A, B>): AndThen<[A, C], [B, C]> =>
        lift(([a, c]) => [fa(a), c]),

    id: identity,

    compose_: compose_,
  }),
);
