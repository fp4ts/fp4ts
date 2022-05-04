// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, applyTo, flow, id, Kind, pipe } from '@fp4ts/core';
import {
  Applicative,
  Array,
  Backwards,
  Const,
  Contravariant,
  Dual,
  Endo,
  Foldable,
  FoldableWithIndex,
  Function1F,
  Left,
  List,
  Monoid,
  None,
  Option,
  Right,
  Some,
} from '@fp4ts/cats';
import { MonadReader, MonadState } from '@fp4ts/cats-mtl';
import { ProfunctorChoice } from '@fp4ts/optics-kernel';
import * as Monoids from './internal/monoids';
import { Indexable } from './indexable';
import { Indexed, IndexedF } from './indexed';
import { LensLike, Optic, Optical, Over, POptic, POptical } from './optics';
import { asGetting, asIndexedGetting, Getting, IndexedGetting } from './getter';
import { IndexedPTraversal, PTraversal } from './traversal';

export type Fold<S, A> = <F>(
  F: Contravariant<F> & Applicative<F>,
  P: Indexable<Function1F, unknown>,
  Q: Indexable<Function1F, unknown>,
) => LensLike<F, S, A>;

export type IndexedFold<I, S, A> = <F, P>(
  F: Contravariant<F> & Applicative<F>,
  P: Indexable<P, I>,
  Q: Indexable<Function1F, unknown>,
) => Over<F, P, S, A>;

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
        sga(s),
        F.traverseA(G)(afa),
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
  return p => pipe(l, asGetting(Monoid.addition), foldMap)(x => (p(x) ? 1 : 0));
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

export function backwards<I, S, T, A, B>(
  l: IndexedPTraversal<I, S, T, A, B>,
): IndexedPTraversal<I, S, T, A, B>;
export function backwards<S, T, A, B>(
  l: PTraversal<S, T, A, B>,
): PTraversal<S, T, A, B>;
export function backwards<I, S, A>(
  l: IndexedFold<I, S, A>,
): IndexedFold<I, S, A>;
export function backwards<S, A>(l: Fold<S, A>): Fold<S, A>;
export function backwards<S, A>(l: Fold<S, A>): Fold<S, A> {
  return <F>(
      F: Contravariant<F> & Applicative<F>,
      P: Indexable<Function1F, unknown>,
    ): LensLike<F, S, A> =>
    (f: (a: A) => Kind<F, [A]>) =>
    s =>
      pipe(
        l(
          { ...Backwards.Applicative(F), ...Backwards.Contravariant(F) },
          P,
          Indexable.Function1(),
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
        Array.TraversableWithIndex().traverse(F)(f),
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
        Array.TraversableWithIndex().traverse(F)(f),
        F.map(ss => ss.join('\n')),
      );
}

// -- Indexed Methods

export function fromFoldableWithIndex<G, I>(
  G: FoldableWithIndex<G, I>,
): {
  <S, A>(f: (s: S) => Kind<G, [A]>): IndexedFold<I, S, A>;
  <A>(): IndexedFold<I, Kind<G, [A]>, A>;
} {
  const f =
    <S, A>(sga: (s: S) => Kind<G, [A]>) =>
    <F, P>(F: Contravariant<F> & Applicative<F>, P: Indexable<P, I>) =>
    (pafa: Kind<P, [A, Kind<F, [A]>]>) =>
    (s: S): Kind<F, [S]> =>
      pipe(
        sga(s),
        F.traverseWithIndexA(G)(P.indexed(pafa)),
        F.map(() => {}),
        F.contramap(() => {}),
      );
  return (sga: any = id) => f(sga) as IndexedFold<any, any, any>;
}

export function ifoldMap<I, R, S, A>(
  l: IndexedGetting<I, R, S, A>,
): (f: (a: A, i: I) => R) => (s: S) => R {
  return l;
}

export function ifoldRight<I, S, A>(
  l: IndexedFold<I, S, A>,
): <R>(z: R, f: (a: A, r: R, i: I) => R) => (s: S) => R {
  return <R>(z: R, f: (a: A, r: R, i: I) => R) =>
    s =>
      pipe(
        l,
        asIndexedGetting(Endo.MonoidK.algebra<R>()),
        ifoldMap,
      )((a: A, i: I) => (r: R) => f(a, r, i))(s)(z);
}

export function ifoldLeft<I, S, A>(
  l: IndexedFold<I, S, A>,
): <R>(z: R, f: (r: R, a: A, i: I) => R) => (s: S) => R {
  return <R>(z: R, f: (r: R, a: A, i: I) => R) =>
    s =>
      pipe(
        l,
        asIndexedGetting(Dual.Monoid(Endo.MonoidK.algebra<R>())),
        ifoldMap,
        applyTo((a: A, i: I) => Dual((r: R) => f(r, a, i))),
        applyTo(s),
        Dual.getDual,
      )(z);
}

export function ipreview<F, S>(
  F: MonadReader<F, S>,
): <I, A>(l: IndexedFold<I, S, A>) => Kind<F, [Option<[A, I]>]> {
  return flow(iheadOption, F.asks);
}

export function ipreuse<F, S>(
  F: MonadState<F, S>,
): <I, A>(l: IndexedFold<I, S, A>) => Kind<F, [Option<[A, I]>]> {
  return l => F.inspect(iheadOption(l));
}

export function iheadOption<I, S, A>(
  l: IndexedFold<I, S, A>,
): (s: S) => Option<[A, I]> {
  return pipe(
    l,
    asIndexedGetting(Monoids.firstOption<[A, I]>()),
    ifoldMap,
  )((a, i) => Some([a, i]));
}

export function ilastOption<I, S, A>(
  l: IndexedFold<I, S, A>,
): (s: S) => Option<[A, I]> {
  return pipe(
    l,
    asIndexedGetting(Monoids.lastOption<[A, I]>()),
    ifoldMap,
  )((a, i) => Some([a, i]));
}

export function ifind<I, S, A>(
  l: IndexedFold<I, S, A>,
): {
  <B extends A>(p: (a: A, i: I) => a is B): (s: S) => Option<[B, I]>;
  (p: (a: A, i: I) => boolean): (s: S) => Option<[A, I]>;
} {
  return (p: (p: A, i: I) => boolean) =>
    pipe(
      l,
      asIndexedGetting(Monoids.firstOption<[A, I]>()),
      ifoldMap,
    )((a, i) => (p(a, i) ? Some([a, i]) : None));
}

export function iany<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => (s: S) => boolean {
  return pipe(l, asIndexedGetting(Monoid.disjunction), ifoldMap);
}
export function iall<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => (s: S) => boolean {
  return pipe(l, asIndexedGetting(Monoid.conjunction), ifoldMap);
}

export function icount<I, S, A>(
  l: IndexedFold<I, S, A>,
): (p: (a: A, i: I) => boolean) => (s: S) => number {
  return p =>
    pipe(
      l,
      asIndexedGetting(Monoid.addition),
      ifoldMap,
    )((x, i) => (p(x, i) ? 1 : 0));
}

type IFiltered<I, A, B = A> = {
  <F, P>(F: Applicative<F>, P: Indexable<P, I>): POptical<
    F,
    P,
    $<IndexedF, [I]>,
    A,
    A,
    B,
    B
  >;
  _A?: B;
  _B?: B;
  _S?: A;
  _T?: A;
};
export function ifiltered<I, A, B extends A>(
  p: (a: A, i: I) => a is B,
): IFiltered<I, A, B>;
export function ifiltered<I, A>(p: (a: A, i: I) => boolean): IFiltered<I, A>;
export function ifiltered<I, A>(
  p: (a: A, i: I) => boolean,
): <F, P>(
  F: Applicative<F>,
  P: Indexable<P, I>,
  Q: Indexable<$<IndexedF, [I]>, I>,
) => Optical<F, P, $<IndexedF, [I]>, A, A> {
  return <F, P>(F: Applicative<F>, P: Indexable<P, I>) =>
    (pafb: Kind<P, [A, Kind<F, [A]>]>): Indexed<I, A, Kind<F, [A]>> =>
    (a: A, i: I): Kind<F, [A]> =>
      p(a, i) ? P.indexed(pafb)(a, i) : F.pure(a);
}
