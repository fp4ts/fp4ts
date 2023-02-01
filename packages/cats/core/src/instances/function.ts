// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  constant,
  EvalF,
  F0,
  F1,
  Fix,
  id,
  Kind,
  lazy,
  TyK,
  TyVar,
  α,
  λ,
} from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Arrow, ArrowApply, ArrowChoice } from '../arrow';
import { CoflatMap } from '../coflat-map';
import { Comonad } from '../comonad';
import { Contravariant } from '../contravariant';
import { Defer } from '../defer';
import { Distributive } from '../distributive';
import { EqK } from '../eq-k';
import { Functor } from '../functor';
import { MonoidK } from '../monoid-k';
import { StackSafeMonad } from '../stack-safe-monad';

import { Either, Left, Right } from '../data';

// -- Function0

export const function0EqK = lazy(() =>
  EqK.of<Function0F>({ liftEq: Eq.Function0 }),
);

export const function0Defer = lazy(() =>
  Defer.of<Function0F>({ defer: F0.defer }),
);

const function0Functor = lazy(() => Functor.of<Function0F>({ map_: F0.map }));

export const function0Distributive = lazy(() =>
  Distributive.of<Function0F>({
    ...function0Functor(),
    distribute_:
      <G>(G: Functor<G>) =>
      <A, B>(ga: Kind<G, [A]>, f: (a: A) => () => B) =>
      () =>
        G.map_(ga, (a: A) => f(a)()),
  }),
);

export const function0Comonad = lazy(() =>
  Comonad.of<Function0F>({
    ...function0Functor(),
    extract: fa => fa(),
    coflatMap_:
      <A, B>(fa: () => A, f: (fa: () => A) => B) =>
      () =>
        f(fa),
  }),
);

export const function0Monad = lazy(() =>
  StackSafeMonad.of<Function0F>({
    ...function0Defer(),
    ...function0Functor(),
    pure: constant,
    flatMap_: F0.flatMap,
    tailRecM_:
      <S, A>(s: S, f: (x: S) => () => Either<S, A>) =>
      () => {
        let cur = f(s)();
        while (cur.isLeft) {
          cur = f(cur.getLeft)();
        }
        return cur.get;
      },
  }),
);

// -- Function1

export const endoMonoidK = lazy(() => {
  const M = Monoid.Endo<any>();
  return MonoidK.of<EndoF>({
    combineK_: M.combine_,
    emptyK: () => id,
    algebra: () => M,
  });
});

export const endoEvalMonoidK = lazy(() => {
  const M = Monoid.EndoEval<any>();
  return MonoidK.of<[EndoF, EvalF]>({
    combineK_: M.combine_,
    emptyK: () => id,
    algebra: () => M,
  });
});

export const function1Defer = lazy(<R>() =>
  Defer.of<$<Function1F, [R]>>({
    defer: F1.defer,
  }),
) as <R>() => Defer<$<Function1F, [R]>>;

export const function1Functor = lazy(<R>() =>
  Functor.of<$<Function1F, [R]>>({
    map_: F1.andThen,
  }),
) as <R>() => Functor<$<Function1F, [R]>>;

export const function1Contravariant = lazy(<R>() =>
  Contravariant.of<λ<Function1F, [α, Fix<R>]>>({
    contramap_: F1.compose,
  }),
) as <R>() => Contravariant<λ<Function1F, [α, Fix<R>]>>;

export const function1Distributive = lazy(<R>() =>
  Distributive.of<$<Function1F, [R]>>({
    ...function1Functor(),
    distribute_:
      <G>(G: Functor<G>) =>
      <A, B>(ga: Kind<G, [A]>, f: (a: A) => (r: R) => B) =>
      (r: R) =>
        G.map_(ga, (a: A) => f(a)(r)),
  }),
) as <R>() => Distributive<$<Function1F, [R]>>;

export const function1CoflatMap = lazy(<R>() =>
  CoflatMap.of<$<Function1F, [R]>>({
    ...function1Functor(),
    coflatMap_:
      <A, B>(fa: (r: R) => A, f: (fa: (r: R) => A) => B) =>
      (r: R) =>
        f(fa),
  }),
) as <R>() => CoflatMap<$<Function1F, [R]>>;

export const function1Monad = lazy(<R>() =>
  StackSafeMonad.of<$<Function1F, [R]>>({
    ...function1Functor(),
    ...function1Defer(),
    pure: constant,
    flatMap_: F1.flatMap,
  }),
) as <R>() => StackSafeMonad<$<Function1F, [R]>>;

export const function1Arrow = lazy(() =>
  Arrow.of<Function1F>({
    compose_: F1.compose,
    andThen_: F1.andThen,

    id: () => id,
    lift: id,
    first:
      <C>() =>
      <A, B>(f: (a: A) => B) =>
      ([a, c]: [A, C]): [B, C] =>
        [f(a), c],
    second:
      <C>() =>
      <A, B>(f: (a: A) => B) =>
      ([c, a]: [C, A]): [C, B] =>
        [c, f(a)],

    merge_: <A, B, C>(f: (a: A) => B, g: (a: A) => C): ((a: A) => [B, C]) =>
      F1.flatMap(f, b => F1.andThen(g, c => [b, c])),

    lmap_: F1.compose,

    rmap_: F1.andThen,
  }),
);

export const function1ArrowChoice = lazy(() =>
  ArrowChoice.of<Function1F>({
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

export const function1ArrowApply = lazy(() =>
  ArrowApply.of<Function1F>({
    ...function1Arrow(),
    app:
      <A, B>() =>
      ([fab, a]: [(a: A) => B, A]) =>
        fab(a),

    Monad: function1Monad(),
  }),
);

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
/**
 * @category Type Constructor
 * @category Data
 */
export interface EndoF extends TyK<[unknown]> {
  [$type]: (a: TyVar<this, 0>) => TyVar<this, 0>;
}
