// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  compose,
  Fix,
  id,
  Kind,
  Lazy,
  lazyVal,
  TyK,
  TyVar,
  α,
  λ,
} from '@fp4ts/core';
import { Applicative } from '../applicative';
import { Arrow, ArrowApply, ArrowChoice } from '../arrow';
import { Contravariant } from '../contravariant';
import { Functor } from '../functor';
import { Distributive } from '../distributive';
import { Monad } from '../monad';
import { Either, Left, Right } from './either';

export const Function1: Function1Obj = function () {};

interface Function1Obj {
  Functor<A>(): Functor<$<Function1F, [A]>>;
  Distributive<A>(): Distributive<$<Function1F, [A]>>;
  Contravariant<A>(): Contravariant<λ<Function1F, [α, Fix<A>]>>;
  Applicative<A>(): Applicative<$<Function1F, [A]>>;
  Monad<A>(): Monad<$<Function1F, [A]>>;
  ArrowApply: ArrowApply<Function1F>;
  ArrowChoice: ArrowChoice<Function1F>;
}

// -- Instances

const function1Functor: <A>() => Functor<$<Function1F, [A]>> = lazyVal(<A>() =>
  Functor.of<$<Function1F, [A]>>({
    map_:
      <B, C>(fa: (a: A) => B, f: (a: B) => C) =>
      (a: A) =>
        f(fa(a)),
  }),
) as <A>() => Functor<$<Function1F, [A]>>;

const function1Distributive = <R>(): Distributive<$<Function1F, [R]>> =>
  Distributive.of({
    ...function1Functor(),
    distribute_:
      <G>(G: Functor<G>) =>
      <A, B>(ga: Kind<G, [A]>, f: (a: A) => (r: R) => B) =>
      (r: R) =>
        G.map_(ga, (a: A) => f(a)(r)),
  });

const function1Applicative: <A>() => Applicative<$<Function1F, [A]>> = lazyVal(<
  A,
>() =>
  Applicative.of<$<Function1F, [A]>>({
    ...function1Functor(),
    pure:
      <B>(b: B) =>
      () =>
        b,
    ap_:
      <B, C>(ff: (a: A) => (b: B) => C, fb: (a: A) => B) =>
      (a: A): C =>
        ff(a)(fb(a)),
  }),
) as <A>() => Applicative<$<Function1F, [A]>>;

const function1Monad: <A>() => Monad<$<Function1F, [A]>> = lazyVal(<A>() =>
  Monad.of<$<Function1F, [A]>>({
    ...function1Applicative(),
    flatMap_:
      <B, C>(fab: (a: A) => B, f: (b: B) => (a: A) => C) =>
      (a: A): C =>
        f(fab(a))(a),
    tailRecM_:
      <S, B>(s: S, f: (s: S) => (a: A) => Either<S, B>) =>
      (a: A): B => {
        let res: Either<S, B> = f(s)(a);
        while (res.isLeft) {
          res = f(res.getLeft)(a);
        }
        return res.get;
      },
  }),
) as <A>() => Monad<$<Function1F, [A]>>;

const function1Contravariant: <A>() => Contravariant<
  λ<Function1F, [α, Fix<A>]>
> = lazyVal(<A>() =>
  Contravariant.of<λ<Function1F, [α, Fix<A>]>>({
    contramap_:
      <B, C>(fa: (b: B) => A, f: (c: C) => B) =>
      (c: C) =>
        fa(f(c)),
  }),
) as <A>() => Contravariant<λ<Function1F, [α, Fix<A>]>>;

const function1Arrow: Lazy<Arrow<Function1F>> = lazyVal(() =>
  Arrow.of({
    compose_: compose,
    id:
      <A>() =>
      (x: A) =>
        x,
    first:
      <C>() =>
      <A, B>(f: (a: A) => B) =>
      ([a, c]: [A, C]): [B, C] =>
        [f(a), c],
    lift: id,
  }),
);

const function1ArrowApply: Lazy<ArrowApply<Function1F>> = lazyVal(() =>
  ArrowApply.of({
    ...function1Arrow(),
    app:
      <A, B>() =>
      ([fab, a]: [(a: A) => B, A]) =>
        fab(a),
  }),
);

const function1ArrowChoice: Lazy<ArrowChoice<Function1F>> = lazyVal(() =>
  ArrowChoice.of({
    ...function1Arrow(),
    choose:
      <A, B, C, D>(f: (a: A) => C, g: (b: B) => D) =>
      (ea: Either<A, B>): Either<C, D> =>
        ea.fold(
          a => Left(f(a)),
          b => Right(g(b)),
        ),
  }),
);

Function1.Functor = function1Functor;
Function1.Distributive = function1Distributive;
Function1.Contravariant = function1Contravariant;
Function1.Applicative = function1Applicative;
Function1.Monad = function1Monad;
Function1.ArrowApply = function1ArrowApply();
Function1.ArrowChoice = function1ArrowChoice();

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface Function0F extends TyK<[unknown]> {
  [$type]: () => TyVar<this, 0>;
}
/**
 * @category Type Constructor
 * @category Data
 */
export interface Function1F extends TyK<[unknown, unknown]> {
  [$type]: (a: TyVar<this, 0>) => TyVar<this, 1>;
}
