// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  cached,
  Eval,
  F1,
  id,
  Kind,
  lazy,
  TyK,
  TyVar,
} from '@fp4ts/core';
import {
  Applicative,
  Contravariant,
  Foldable,
  Functor,
  MonoidK,
  Traversable,
  TraverseStrategy,
} from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Const, ConstF, Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { Choice, Cochoice } from '../choice';
import { Profunctor } from '../profunctor';
import { Strong } from '../strong';
import { Sieve } from '../sieve';
import { Representable } from '../representable';
import { Traversing } from '../traversing';

/**
 * `Const<R, B>` Functor lifted into a Profunctor `Forget<R, A, B>` consuming
 * input `A`, ignoring the output `B` by returning `R`.
 */
export type Forget<R, A, B> = (a: A) => R;
export const Forget = function <R, A, B>(f: (a: A) => R): Forget<R, A, B> {
  return f;
};

const forgetMonoidK = cached(<R, E>(R: Monoid<R>) =>
  MonoidK.of<$<ForgetF, [R, E]>>({
    emptyK: () => _ => R.empty,
    combineK_: (f, g) =>
      F1.flatMap(f, r1 => F1.andThen(g, r2 => R.combine_(r1, r2))),
    combineKEval_: (f, eg) =>
      Eval.now(
        (e: E) =>
          R.combineEval_(
            f(e),
            eg.map(g => g(e)),
          ).value,
      ),
  }),
);

const forgetFunctor = lazy(<R, E>() =>
  Functor.of<$<ForgetF, [R, E]>>({ map_: (f, _) => f }),
) as <R, E>() => Functor<$<ForgetF, [R, E]>>;

const forgetApplicative = cached(<R, E>(R: Monoid<R>) => {
  const self = Applicative.of<$<ForgetF, [R, E]>>({
    ...forgetFunctor(),
    pure: _ => _ => R.empty,
    ap_: (f, g) => F1.flatMap(f, r1 => F1.andThen(g, r2 => R.combine_(r1, r2))),
    map2_: (f, g, _) =>
      F1.flatMap(f, r1 => F1.andThen(g, r2 => R.combine_(r1, r2))),
    map2Eval_: (f, eg) =>
      Eval.now(
        (e: E) =>
          R.combineEval_(
            f(e),
            eg.map(g => g(e)),
          ).value,
      ),
  });

  const ts: TraverseStrategy<$<ForgetF, [R, E]>, $<ForgetF, [Eval<R>, E]>> = {
    toG: fa => F1.andThen(fa, r => r.value),
    toRhs: thunk => (e: E) => Eval.always(() => thunk()(e)),
    map: (fa, f) => fa,
    map2: (fa, fb, f) => (e: E) =>
      Eval.defer(() => fa(e)).flatMap(a => R.combineEval_(a, fb(e))),
    defer: thunk => (e: E) => Eval.defer(() => thunk()(e)),
  };

  self.TraverseStrategy = use => use(ts);

  return self;
});

const forgetContravariant = lazy(<R, E>() =>
  Contravariant.of<$<ForgetF, [R, E]>>({ contramap_: (pab, f) => pab }),
) as <R, E>() => Contravariant<$<ForgetF, [R, E]>>;

const forgetFoldable = lazy(<R, E>() =>
  Foldable.of<$<ForgetF, [R, E]>>({
    foldLeft_: (pab, z, _) => z,
    foldRight_: (pab, ez, _) => ez,
  }),
) as <R, E>() => Foldable<$<ForgetF, [R, E]>>;

const forgetTraversable = lazy(<R, E>() =>
  Traversable.of<$<ForgetF, [R, E]>>({
    ...forgetFoldable(),
    ...forgetFunctor(),
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(pab: Forget<R, E, A>, f: (a: A) => Kind<G, [B]>) =>
        G.pure(pab),
  }),
) as <R, E>() => Traversable<$<ForgetF, [R, E]>>;

const forgetProfunctor = lazy(<R>() =>
  Profunctor.of<$<ForgetF, [R]>>({
    dimap_: (pab, f, g) => F1.compose(pab, f),
    lmap_: (pab, f) => F1.compose(pab, f),
    rmap_: (pab, g) => pab,
  }),
) as <R>() => Profunctor<$<ForgetF, [R]>>;

const forgetStrong = lazy(<R>() =>
  Strong.of<$<ForgetF, [R]>>({
    ...forgetProfunctor(),

    first:
      <C>() =>
      <A, B>(pab: Forget<R, A, B>): Forget<R, [A, C], [B, C]> =>
        F1.compose(pab, ac => ac[0]),

    second:
      <C>() =>
      <A, B>(pab: Forget<R, A, B>): Forget<R, [C, A], [C, B]> =>
        F1.compose(pab, ac => ac[1]),
  }),
) as <R>() => Strong<$<ForgetF, [R]>>;

const forgetChoice = cached(<R>(R: Monoid<R>) =>
  Choice.of<$<ForgetF, [R]>>({
    ...forgetProfunctor(),

    left:
      <C>() =>
      <A, B>(pab: Forget<R, A, B>) =>
      (ac: Either<A, C>) =>
        ac.fold(pab, _ => R.empty),

    right:
      <C>() =>
      <A, B>(pab: Forget<R, A, B>) =>
      (ca: Either<C, A>) =>
        ca.fold(_ => R.empty, pab),
  }),
);

const forgetCochoice = lazy(<R>() =>
  Cochoice.of<$<ForgetF, [R]>>({
    ...forgetProfunctor(),

    unleft: <A, B, C>(pab: Forget<R, Either<A, C>, Either<B, C>>) =>
      F1.compose(pab, Left<A, C>),
    unright: <A, B, C>(pab: Forget<R, Either<C, A>, Either<C, B>>) =>
      F1.compose(pab, Right<A, C>),
  }),
) as <R>() => Cochoice<$<ForgetF, [R]>>;

const forgetSieve = lazy(<R>() =>
  Sieve.of<$<ForgetF, [R]>, $<ConstF, [R]>>({
    ...forgetProfunctor(),

    F: Const.Functor(),

    sieve: id,
  }),
) as <R>() => Sieve<$<ForgetF, [R]>, $<ConstF, [R]>>;

const forgetRepresentable = lazy(<R>() =>
  Representable.of<$<ForgetF, [R]>, $<ConstF, [R]>>({
    ...forgetSieve(),
    ...forgetStrong(),

    tabulate: id,
  }),
) as <R>() => Representable<$<ForgetF, [R]>, $<ConstF, [R]>>;

const forgetTraversing = cached(<R>(R: Monoid<R>) =>
  Traversing.of<$<ForgetF, [R]>>({
    ...forgetStrong(),
    ...forgetChoice(R),

    traverse_: (F, pab) => F.foldMap(R)(pab),
    wander_: (pab, f) => f(Const.Applicative(R))(pab),
  }),
);

Forget.MonoidK = forgetMonoidK;
Forget.Functor = forgetFunctor;
Forget.Applicative = forgetApplicative;
Forget.Contravariant = forgetContravariant;
Forget.Foldable = forgetFoldable;
Forget.Traversable = forgetTraversable;
Forget.Profunctor = forgetProfunctor;
Forget.Strong = forgetStrong;
Forget.Choice = forgetChoice;
Forget.Cochoice = forgetCochoice;
Forget.Sieve = forgetSieve;
Forget.Representable = forgetRepresentable;
Forget.Traversing = forgetTraversing;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ForgetF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Forget<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
