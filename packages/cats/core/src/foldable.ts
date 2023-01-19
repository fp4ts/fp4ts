// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind, instance, tupled, TyK, $type, TyVar } from '@fp4ts/core';
import { CommutativeMonoid, Monoid } from '@fp4ts/cats-kernel';
import { Monad } from './monad';
import { MonoidK } from './monoid-k';
import { UnorderedFoldable } from './unordered-foldable';
import {
  List,
  ListBuffer,
  Vector,
  VectorBuilder,
  Option,
  Some,
  None,
  Either,
  Left,
  Right,
  Endo,
  LazyList,
  View,
} from './data';
import { ComposedFoldable } from './composed';

/**
 * @category Type Class
 */
export interface Foldable<F> extends UnorderedFoldable<F> {
  /**
   * Right associative, lazy fold mapping each element of the structure `Kind<F, [A]>`
   * into a monoid `M` and combining their results using `combineEval`.
   *
   * For a strict version, see `foldMapLeft`.
   */
  foldMap<M>(M: Monoid<M>): <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  /**
   * Right associative, lazy fold mapping each element of the structure `Kind<F, [A]>`
   * into a monoid `M` and combining their results using `combineEval`.
   *
   * For a strict version, see `foldMapLeft`.
   */
  foldMap_<M>(M: Monoid<M>): <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;

  /**
   * Left associative, strict variant of the `foldMap` using monoid's `combine`
   * operator to combine results.
   */
  foldMapLeft<M>(M: Monoid<M>): <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  /**
   * Left associative, strict variant of the `foldMap` using monoid's `combine`
   * operator to combine results.
   */
  foldMapLeft_<M>(M: Monoid<M>): <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;

  /**
   * Right associative, lazy fold of the structure into a lazy accumulated value
   * `Eval<B>`.
   */
  foldRight<A, B>(
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): (fa: Kind<F, [A]>) => Eval<B>;
  /**
   * Right associative, lazy fold of the structure into a lazy accumulated value
   * `Eval<B>`.
   */
  foldRight_<A, B>(
    fa: Kind<F, [A]>,
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): Eval<B>;

  /**
   * Left associative, strict fold of the structure into an accumulated value `B`.
   */
  foldLeft<A, B>(b: B, f: (b: B, a: A) => B): (fa: Kind<F, [A]>) => B;
  /**
   * Left associative, strict fold of the structure into an accumulated value `B`.
   */
  foldLeft_<A, B>(fa: Kind<F, [A]>, b: B, f: (b: B, a: A) => B): B;

  foldMapK<G>(
    G: MonoidK<G>,
  ): <A, B>(f: (a: A) => Kind<G, [B]>) => (fa: Kind<F, [A]>) => Kind<G, [B]>;
  foldMapK_<G>(
    G: MonoidK<G>,
  ): <A, B>(fa: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>) => Kind<G, [B]>;

  foldM<G>(
    G: Monad<G>,
  ): <A, B>(
    z: B,
    f: (b: B, a: A) => Kind<G, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<G, [B]>;
  foldM_<G>(
    G: Monad<G>,
  ): <A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (b: B, a: A) => Kind<G, [B]>,
  ) => Kind<G, [B]>;

  elem(idx: number): <A>(fa: Kind<F, [A]>) => Option<A>;
  elem_<A>(fa: Kind<F, [A]>, idx: number): Option<A>;

  iterator<A>(fa: Kind<F, [A]>): Iterator<A>;
  toList<A>(fa: Kind<F, [A]>): List<A>;
  view<A>(fa: Kind<F, [A]>): View<A>;
  toVector<A>(fa: Kind<F, [A]>): Vector<A>;
}

export type FoldableRequirements<F> = (
  | Pick<Foldable<F>, 'foldMap_'>
  | Pick<Foldable<F>, 'foldRight_'>
) &
  Partial<Foldable<F>>;
export const Foldable = Object.freeze({
  of: <F>(F: FoldableRequirements<F>): Foldable<F> => {
    const self: Foldable<F> = instance<Foldable<F>>({
      ...UnorderedFoldable.of({
        unorderedFoldMap_:
          F.unorderedFoldMap_ ??
          (<M>(M: CommutativeMonoid<M>) => self.foldMap_(M)),
        ...F,
      }),

      foldMap: M => f => fa => self.foldMap_(M)(fa, f),
      foldMap_: M => (fa, f) =>
        self.foldRight_(fa, Eval.now(M.empty), (a, eb) =>
          M.combineEval_(f(a), eb),
        ).value,

      foldMapLeft: M => f => fa => self.foldMapLeft_(M)(fa, f),
      foldMapLeft_: M => (fa, f) =>
        self.foldLeft_(fa, M.empty, (m, a) => M.combine_(m, f(a))),

      foldRight: (z, f) => fa => self.foldRight_(fa, z, f),
      foldRight_: <A, B>(
        fa: Kind<F, [A]>,
        ez: Eval<B>,
        f: (a: A, eb: Eval<B>) => Eval<B>,
      ): Eval<B> =>
        self.foldMap_(Endo.EvalMonoidK.algebra<B>())(
          fa,
          a => (eb: Eval<B>) => f(a, eb),
        )(ez),

      foldLeft: (z, f) => fa => self.foldLeft_(fa, z, f),
      foldLeft_: <A, B>(fa: Kind<F, [A]>, z: B, f: (b: B, a: A) => B): B =>
        self
          .foldRight_(
            fa,
            Eval.now((x: B) => Eval.now(x)),
            (a, ek) => Eval.now((b: B) => ek.flatMap(k => k(f(b, a)))),
          )
          .value(z).value,

      foldMapK: G => f => fa => self.foldMapK_(G)(fa, f),
      foldMapK_:
        <G>(G: MonoidK<G>) =>
        <A, B>(fa: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>) =>
          self.foldMap_(G.algebra<B>())(fa, f),

      foldM: G => (z, f) => fa => self.foldM_(G)(fa, z, f),
      foldM_: G => (fa, z, f) => {
        const src = LazyList.fromFoldable(self)(fa);
        return G.tailRecM(tupled(z, src))(([b, src]) =>
          src.uncons.fold(
            () => G.pure(Right(b)),
            ([a, src]) => G.map_(f(b, a), b => Left(tupled(b, src))),
          ),
        );
      },

      elem: idx => fa => self.elem_(fa, idx),
      elem_: <A>(fa: Kind<F, [A]>, idx: number) => {
        if (idx < 0) return None;
        return self
          .foldM_(Either.Monad<A>())(fa, 0, (i, a) =>
            i === idx ? Left(a) : Right(i + 1),
          )
          .fold(
            a => Some(a),
            () => None,
          );
      },

      count_: (fa, p) =>
        self.foldLeft_(fa, 0, (acc, x) => (p(x) ? acc + 1 : acc)),

      iterator: <A>(fa: Kind<F, [A]>): Iterator<A> => self.view(fa).iterator,

      toList: <A>(fa: Kind<F, [A]>) =>
        self.foldLeft_(fa, new ListBuffer<A>(), (as, a) => as.addOne(a)).toList,

      view: <A>(fa: Kind<F, [A]>) => View.fromFoldable(self)(fa),

      toVector: <A>(fa: Kind<F, [A]>) =>
        self.foldLeft_(fa, new VectorBuilder<A>(), (as, a) => as.addOne(a))
          .toVector,

      ...F,
    });
    return self;
  },

  compose: <F, G>(F: Foldable<F>, G: Foldable<G>): ComposedFoldable<F, G> =>
    ComposedFoldable.of(F, G),
});

// -- HKT

export interface FoldableF extends TyK<[unknown]> {
  [$type]: Foldable<TyVar<this, 0>>;
}
