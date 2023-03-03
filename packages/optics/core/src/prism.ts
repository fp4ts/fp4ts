// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Applicative,
  Either,
  Identity,
  Left,
  Option,
  Right,
} from '@fp4ts/cats';
import { Choice } from '@fp4ts/cats-profunctor';
import { F1, id, Kind } from '@fp4ts/core';
import { Indexable, IndexPreservingOptic, Market } from './internal';
import { Review } from './review';
import { IndexPreservingPTraversal } from './traversal';

export interface PPrism<in S, out T, out A, in B>
  extends Review<T, B>,
    IndexPreservingPTraversal<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;

  readonly runOptic: <F, P>(
    F: Applicative<F>,
    P: Choice<P>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>;

  readonly compose: IndexPreservingOptic<S, T, A, B>['compose'];
}

export type Prism<S, A> = PPrism<S, S, A, A>;

// -- Constructors

export function prism<S, T, A, B>(
  getOrModify: (s: S) => Either<T, A>,
  reverseGet: (b: B) => T,
): PPrism<S, T, A, B>;
export function prism<S, A>(
  getOrModify: (s: S) => Either<S, A>,
  reverseGet: (b: A) => S,
): Prism<S, A>;
export function prism<S, T, A, B>(
  getOrModify: (s: S) => Either<T, A>,
  reverseGet: (b: B) => T,
): PPrism<S, T, A, B> {
  return mkPrism(
    <F, P>(
      F: Applicative<F>,
      P: Choice<P>,
    ): ((pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>) =>
      F1.andThen(
        P.right<T>(),
        P.dimap(getOrModify, ea => ea.fold(F.pure, F.map(reverseGet))),
      ),
  );
}

export function prism_<S, A>(
  getOptional: (s: S) => Option<A>,
  reverseGet: (a: A) => S,
): Prism<S, A> {
  return prism(s => getOptional(s).fold(() => Left(s), Right), reverseGet);
}

export function filtered<S, A extends S>(p: (s: S) => s is A): Prism<S, A>;
export function filtered<S>(p: (s: S) => boolean): Prism<S, S>;
export function filtered<S>(p: (s: S) => boolean): Prism<S, S> {
  const g = (x: S) => (p(x) ? Right(x) : Left(x));
  return mkPrism(<F, P>(F: Applicative<F>, P: Choice<P>) =>
    (P as any) === Indexable.Function1
      ? (((f: (a: S) => Kind<F, [S]>) =>
          (s: S): Kind<F, [S]> =>
            p(s) ? f(s) : F.pure(s)) as any)
      : (P as any) === Indexable.Indexed<any>()
      ? (((f: (a: S, i: unknown) => Kind<F, [S]>) =>
          (s: S, i: unknown): Kind<F, [S]> =>
            p(s) ? f(s, i) : F.pure(s)) as any)
      : (psfs: Kind<P, [S, Kind<F, [S]>]>): Kind<P, [S, Kind<F, [S]>]> =>
          P.dimap_(P.left<S>()(psfs), g, ea =>
            ea.isRight() ? F.pure(ea.get) : ea.getLeft,
          ),
  );
}

// -- Consuming Prisms

export function getOrModify<S, T, A, B>(
  l: PPrism<S, T, A, B>,
): (s: S) => Either<T, A> {
  return l.runOptic(
    Identity.Applicative,
    Market.Choice<A, B>(),
  )(Market(Right, id)).getOrModify;
}

export function getOption<S, T, A, B>(
  l: PPrism<S, T, A, B>,
): (s: S) => Option<A> {
  return F1.andThen(
    l.runOptic(Identity.Applicative, Market.Choice<A, B>())(Market(Right, id))
      .getOrModify,
    ta => ta.toOption,
  );
}

// -- Private helpers

const mkPrism = <S, T, A, B>(
  apply: <F, P>(
    F: Applicative<F>,
    P: Choice<P>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>,
): PPrism<S, T, A, B> => new IndexPreservingOptic(apply as any) as any;
