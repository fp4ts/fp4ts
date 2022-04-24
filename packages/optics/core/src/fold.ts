// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { applyTo, id, Kind, pipe } from '@fp4ts/core';
import {
  Applicative,
  Array,
  Const,
  Contravariant,
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
import * as Monoids from './internal/monoids';
import { Optic, POptic } from './optics';
import { asGetting, Getting } from './getter';
import { Affine } from './affine';
import { ProfunctorChoice } from './profunctor-choice';

export type Fold<S, A> = <F>(
  F: Contravariant<F> & Applicative<F>,
  P: Affine<Function1F>,
) => Optic<F, Function1F, S, A>;

export function fromFoldable<G>(
  G: Foldable<G>,
): <S, A>(sga: (s: S) => Kind<G, [A]>) => Fold<S, A> {
  return <S, A>(sga: (s: S) => Kind<G, [A]>) =>
    <F>(F: Contravariant<F> & Applicative<F>) =>
    (afa: (a: A) => Kind<F, [A]>) =>
    (s: S): Kind<F, [S]> =>
      pipe(
        F.traverseA_(G)(sga(s), afa),
        F.map(() => {}),
        F.contramap(() => {}),
      );
}

export function foldMap<R, A>(
  f: (a: A) => R,
): <S>(l: Getting<R, S, A>) => (s: S) => R {
  return applyTo(f);
}

export function foldRight<R, S, A>(
  z: R,
  f: (a: A, r: R) => R,
): (l: Getting<Endo<R>, S, A>) => (s: S) => R {
  return l => s => foldMap((a: A) => (r: R) => f(a, r))(l)(s)(z);
}

export function fold<S, A>(l: Getting<A, S, A>): (s: S) => A {
  return l(Const);
}

export function toList<S, A>(l: Fold<S, A>): (s: S) => List<A> {
  return pipe(
    l,
    asGetting(Endo.MonoidK.algebra<List<A>>()),
    foldRight(List.empty as List<A>, List.cons),
  );
}

export function isEmpty<S, A>(l: Fold<S, A>): (s: S) => boolean {
  return pipe(
    l,
    asGetting(Monoid.conjunction),
    foldMap(() => false as boolean),
  );
}
export function nonEmpty<S, A>(l: Fold<S, A>): (s: S) => boolean {
  return pipe(
    l,
    asGetting(Monoid.disjunction),
    foldMap(() => true as boolean),
  );
}

export function find<A, B extends A>(
  p: (a: A) => a is B,
): <S>(l: Fold<S, A>) => (s: S) => Option<B>;
export function find<A>(
  p: (a: A) => boolean,
): <S>(l: Fold<S, A>) => (s: S) => Option<A>;
export function find<A>(
  p: (a: A) => boolean,
): <S>(l: Fold<S, A>) => (s: S) => Option<A> {
  return l =>
    pipe(
      l,
      asGetting(Monoids.firstOption<A>()),
      foldMap(x => Some(x).filter(p)),
    );
}

export function headOption<S, A>(l: Fold<S, A>): (s: S) => Option<A> {
  return pipe(l, asGetting(Monoids.firstOption<A>()), foldMap(Some));
}
export function lastOption<S, A>(l: Fold<S, A>): (s: S) => Option<A> {
  return pipe(l, asGetting(Monoids.lastOption<A>()), foldMap(Some));
}

export function any<A>(
  p: (a: A) => boolean,
): <S>(l: Fold<S, A>) => (s: S) => boolean {
  return l => pipe(l, asGetting(Monoid.disjunction), foldMap(p));
}
export function all<A>(
  p: (a: A) => boolean,
): <S>(l: Fold<S, A>) => (s: S) => boolean {
  return l => pipe(l, asGetting(Monoid.conjunction), foldMap(p));
}

export function count<A>(
  p: (a: A) => boolean,
): <S>(l: Fold<S, A>) => (s: S) => number {
  return l =>
    pipe(
      l,
      asGetting(Monoid.addition),
      foldMap(x => (p(x) ? 1 : 0) as number),
    );
}

export function size<S, A>(l: Fold<S, A>): (s: S) => number {
  return pipe(
    l,
    asGetting(Monoid.addition),
    foldMap(() => 1),
  );
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
