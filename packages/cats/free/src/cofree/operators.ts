// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, EvalF } from '@fp4ts/core';
import {
  Applicative,
  Foldable,
  FunctionK,
  Functor,
  Monad,
  Traversable,
} from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Kind, pipe } from '@fp4ts/core';

import { Cofree } from './algebra';
import { anaEval, unfoldEval } from './constructors';

export const forcedTail = <S, A>(csa: Cofree<S, A>): Cofree<S, A> =>
  new Cofree(csa.head, Eval.now(csa.tail.value));

export const transform: <S>(
  S: Functor<S>,
) => <A, B>(
  f: (head: A) => B,
  g: (tail: Cofree<S, A>) => Cofree<S, B>,
) => (cfa: Cofree<S, A>) => Cofree<S, B> = S => (f, g) => cfa =>
  transform_(S)(cfa, f, g);

export const map: <S>(
  S: Functor<S>,
) => <A, B>(f: (a: A) => B) => (cfa: Cofree<S, A>) => Cofree<S, B> =
  S => f => cfa =>
    map_(S)(cfa, f);

export const coflatMap: <S>(
  S: Functor<S>,
) => <A, B>(
  f: (cfr: Cofree<S, A>) => B,
) => (cfa: Cofree<S, A>) => Cofree<S, B> = S => f => cfa =>
  coflatMap_(S)(cfa, f);

export const coflatten =
  <S>(S: Functor<S>) =>
  <A>(cfa: Cofree<S, A>): Cofree<S, Cofree<S, A>> =>
    unfoldEval(S)(cfa)(cfr => cfr.tail);

export const extract = <S, A>(cfa: Cofree<S, A>): A => cfa.head;

export const cata = <S>(S: Traversable<S>) => {
  const cata =
    <A>(cfa: Cofree<S, A>) =>
    <B>(folder: (a: A, sb: Kind<S, [B]>) => Eval<B>): Eval<B> =>
      pipe(
        cfa.tail.value,
        S.traverse(Monad.Eval)(fr => Eval.defer(() => cata(fr)(folder))),
      ).flatMap(fb => folder(cfa.head, fb));
  return cata;
};

export const cataM =
  <S, M>(S: Traversable<S>, M: Monad<M>) =>
  <A>(cfa: Cofree<S, A>) =>
  <B>(
    folder: (a: A, sb: Kind<S, [B]>) => Kind<M, [B]>,
    inclusion: FunctionK<EvalF, M>,
  ): Kind<M, [B]> => {
    function loop(free: Cofree<S, A>): Eval<Kind<M, [B]>> {
      const looped = pipe(
        free.tail.value,
        S.traverse(M)(fr => M.flatten(inclusion(Eval.defer(() => loop(fr))))),
      );
      const folded = M.flatMap_(looped, sb => folder(free.head, sb));
      return Eval.now(folded);
    }

    return M.flatten(inclusion(loop(cfa)));
  };

// -- Point-ful operators

export const transform_ =
  <S>(S: Functor<S>) =>
  <A, B>(
    cfa: Cofree<S, A>,
    f: (head: A) => B,
    g: (tail: Cofree<S, A>) => Cofree<S, B>,
  ): Cofree<S, B> =>
    new Cofree(f(cfa.head), cfa.tail.map(S.map(g)));

export const map_ =
  <S>(S: Functor<S>) =>
  <A, B>(cfa: Cofree<S, A>, f: (a: A) => B): Cofree<S, B> =>
    transform_(S)(cfa, f, map(S)(f));

export const coflatMap_ =
  <S>(S: Functor<S>) =>
  <A, B>(cfa: Cofree<S, A>, f: (cfr: Cofree<S, A>) => B): Cofree<S, B> =>
    anaEval(S)(cfa)(cfr => cfr.tail, f);

export const foldMap_ =
  <S, M>(S: Foldable<S>, M: Monoid<M>) =>
  <A>(csa: Cofree<S, A>, f: (a: A) => M): M =>
    foldRight_(S)(csa, Eval.now(M.empty), (a, eb) => M.combineEval_(f(a), eb))
      .value;

export const foldLeft_ = <S>(S: Foldable<S>) => {
  const foldLeft_ = <A, B>(csa: Cofree<S, A>, z: B, f: (b: B, a: A) => B): B =>
    S.foldLeft_(csa.tail.value, f(z, csa.head), (b, cof) =>
      foldLeft_(cof, b, f),
    );
  return foldLeft_;
};

export const foldRight_ = <S>(S: Foldable<S>) => {
  const foldRight_ = <A, B>(
    csa: Cofree<S, A>,
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): Eval<B> =>
    f(
      csa.head,
      csa.tail.flatMap(S.foldRight(ez, (cfr, eb) => foldRight_(cfr, eb, f))),
    );
  return foldRight_;
};

export const traverse_ = <S, G>(S: Traversable<S>, G: Applicative<G>) => {
  const traverse_ = <A, B>(
    csa: Cofree<S, A>,
    f: (a: A) => Kind<G, [B]>,
  ): Kind<G, [Cofree<S, B>]> =>
    G.map2_(
      f(csa.head),
      S.traverse_(G)(csa.tail.value, csa => traverse_(csa, f)),
    )((h, t) => new Cofree(h, Eval.now(t)));

  return traverse_;
};
