// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { applyTo, flow, id, Kind, pipe } from '@fp4ts/core';
import {
  Applicative,
  Array,
  Backwards,
  Const,
  Contravariant,
  Dual,
  Endo,
  Foldable,
  Function1F,
  Left,
  List,
  Monoid,
  Option,
  Right,
  Some,
} from '@fp4ts/cats';
import { MonadReader, MonadState } from '@fp4ts/cats-mtl';
import { Affine, ProfunctorChoice } from '@fp4ts/optics-kernel';
import * as Monoids from './internal/monoids';
import { Optic, POptic } from './optics';
import { asGetting, Getting } from './getter';
import { PTraversal } from './traversal';

export type Fold<S, A> = <F>(
  F: Contravariant<F> & Applicative<F>,
  P: Affine<Function1F>,
) => Optic<F, Function1F, S, A>;

export function fromFoldable<G>(G: Foldable<G>): {
  <S, A>(sga: (s: S) => Kind<G, [A]>): Fold<S, A>;
  <A>(): Fold<Kind<G, [A]>, A>;
} {
  const f =
    <S, A>(sga: (s: S) => Kind<G, [A]>) =>
    <F>(F: Contravariant<F> & Applicative<F>) =>
    (afa: (a: A) => Kind<F, [A]>) =>
    (s: S): Kind<F, [S]> =>
      pipe(
        F.traverseA_(G)(sga(s), afa),
        F.map(() => {}),
        F.contramap(() => {}),
      );

  return (sga: any = id) => f(sga) as Fold<any, any>;
}

export function foldMap<R, S, A>(
  l: Getting<R, S, A>,
): (f: (a: A) => R) => (s: S) => R {
  return l;
}

export function foldRight<S, A>(
  l: Fold<S, A>,
): <R>(z: R, f: (a: A, r: R) => R) => (s: S) => R {
  return <R>(z: R, f: (a: A, r: R) => R) =>
    s =>
      pipe(
        l,
        asGetting(Endo.MonoidK.algebra<R>()),
        foldMap,
      )((a: A) => (r: R) => f(a, r))(s)(z);
}

export function foldLeft<S, A>(
  l: Fold<S, A>,
): <R>(z: R, f: (r: R, a: A) => R) => (s: S) => R {
  return <R>(z: R, f: (r: R, a: A) => R) =>
    s =>
      pipe(
        l,
        asGetting(Dual.Monoid(Endo.MonoidK.algebra<R>())),
        foldMap,
        applyTo((a: A) => Dual((r: R) => f(r, a))),
        applyTo(s),
        Dual.getDual,
      )(z);
}

export function fold<S, A>(l: Getting<A, S, A>): (s: S) => A {
  return l(Const);
}

export function toList<S, A>(l: Fold<S, A>): (s: S) => List<A> {
  return foldRight(l)(List.empty as List<A>, List.cons);
}

export function preview<F, S>(
  F: MonadReader<F, S>,
): <A>(l: Fold<S, A>) => Kind<F, [Option<A>]> {
  return flow(headOption, F.asks);
}

export function preuse<F, S>(
  F: MonadState<F, S>,
): <A>(l: Fold<S, A>) => Kind<F, [Option<A>]> {
  return l => F.inspect(headOption(l));
}

export function isEmpty<S, A>(l: Fold<S, A>): (s: S) => boolean {
  return pipe(l, asGetting(Monoid.conjunction), foldMap)(() => false);
}
export function nonEmpty<S, A>(l: Fold<S, A>): (s: S) => boolean {
  return pipe(l, asGetting(Monoid.disjunction), foldMap)(() => true);
}

export function find<S, A>(
  l: Fold<S, A>,
): {
  <B extends A>(p: (a: A) => a is B): (s: S) => Option<B>;
  (p: (a: A) => boolean): (s: S) => Option<A>;
} {
  return (p: (p: A) => boolean) =>
    pipe(
      l,
      asGetting(Monoids.firstOption<A>()),
      foldMap,
    )(x => Some(x).filter(p));
}

export function headOption<S, A>(l: Fold<S, A>): (s: S) => Option<A> {
  return pipe(l, asGetting(Monoids.firstOption<A>()), foldMap)(Some);
}
export function lastOption<S, A>(l: Fold<S, A>): (s: S) => Option<A> {
  return pipe(l, asGetting(Monoids.lastOption<A>()), foldMap)(Some);
}

export function any<S, A>(
  l: Fold<S, A>,
): (p: (a: A) => boolean) => (s: S) => boolean {
  return pipe(l, asGetting(Monoid.disjunction), foldMap);
}
export function all<S, A>(
  l: Fold<S, A>,
): (p: (a: A) => boolean) => (s: S) => boolean {
  return pipe(l, asGetting(Monoid.conjunction), foldMap);
}

export function count<S, A>(
  l: Fold<S, A>,
): (p: (a: A) => boolean) => (s: S) => number {
  return p =>
    pipe(l, asGetting(Monoid.addition), foldMap)(x => (p(x) ? 1 : 0) as number);
}

export function size<S, A>(l: Fold<S, A>): (s: S) => number {
  return pipe(l, asGetting(Monoid.addition), foldMap)(() => 1);
}

type Filtered<A, B = A> = {
  <F, P>(F: Applicative<F>, P: ProfunctorChoice<P>): POptic<F, P, A, A, B, B>;
  _A?: B;
  _B?: B;
  _S?: A;
  _T?: A;
};

export function filtered<A, B extends A>(p: (a: A) => a is B): Filtered<A, B>;
export function filtered<A>(p: (a: A) => boolean): Filtered<A>;
export function filtered<A>(
  p: (a: A) => boolean,
): <F, P>(F: Applicative<F>, P: ProfunctorChoice<P>) => Optic<F, P, A, A> {
  return <F, P>(F: Applicative<F>, P: ProfunctorChoice<P>) =>
    (pafa: Kind<P, [A, Kind<F, [A]>]>) =>
      pipe(
        pafa,
        P.right<A>(),
        P.dimap(
          x => (p(x) ? Right(x) : Left(x)),
          ea => ea.fold(F.pure, id),
        ),
      );
}

export function backwards<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): PTraversal<S, T, A, B>;
export function backwards<S, A>(l: Fold<S, A>): Fold<S, A>;
export function backwards<S, A>(l: Fold<S, A>): Fold<S, A> {
  return <F>(
      F: Contravariant<F> & Applicative<F>,
      P: Affine<Function1F>,
    ): Optic<F, Function1F, S, A> =>
    (f: (a: A) => Kind<F, [A]>) =>
    s =>
      pipe(
        l(
          { ...Backwards.Applicative(F), ...Backwards.Contravariant(F) },
          P,
        )(flow(f, Backwards))(s),
        Backwards.getBackwards,
      );
}

export function words<F>(
  F: Applicative<F>,
): Optic<F, Function1F, string, string> {
  return (f: (s: string) => Kind<F, [string]>) =>
    (s: string): Kind<F, [string]> =>
      pipe(
        s.trim().split(/\s+/),
        Array.Traversable().traverse(F)(f),
        F.map(ss => ss.join(' ')),
      );
}

export function lines<F>(
  F: Applicative<F>,
): Optic<F, Function1F, string, string> {
  return (f: (s: string) => Kind<F, [string]>) =>
    (s: string): Kind<F, [string]> =>
      pipe(
        s.split(/\r?\n/),
        Array.Traversable().traverse(F)(f),
        F.map(ss => ss.join('\n')),
      );
}
