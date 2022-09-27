// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Eval, Foldable, MonoidK } from '@fp4ts/cats-core';
import {
  List,
  Vector,
  Identity,
  Option,
  Some,
  None,
  Either,
  Left,
  Right,
} from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

export const FoldableLaws = <F>(F: Foldable<F>): FoldableLaws<F> => ({
  foldRightLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.foldRight_(fa, Eval.now('empty'), () => {
      i += 1;
      return Eval.now('not empty');
    }).value;
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  leftFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A) => B): IsEq<B> =>
      new IsEq(
        F.foldMap_(B)(fa, f),
        F.foldLeft_(fa, B.empty, (b, a) => B.combine_(b, () => f(a))),
      ),

  rightFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A) => B): IsEq<B> => {
      const M = Eval.Monoid(B);

      return new IsEq(
        F.foldMap_(B)(fa, f),
        F.foldRight_(fa, M.empty, (a, b) =>
          M.combine_(
            Eval.later(() => f(a)),
            () => b,
          ),
        ).value,
      );
    },

  foldMapKConsistentWithFoldMap:
    <G>(G: MonoidK<G>) =>
    <A, B>(fa: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>): IsEq<Kind<G, [B]>> =>
      new IsEq(F.foldMap_(G.algebra<B>())(fa, f), F.foldMapK_(G)(fa, f)),

  foldMIdentity: <A, B>(
    fa: Kind<F, [A]>,
    b: B,
    f: (b: B, a: A) => B,
  ): IsEq<B> =>
    new IsEq(F.foldM_(Identity.Monad)(fa, b, f), F.foldLeft_(fa, b, f)),

  allConsistentWithAny: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ): boolean => {
    if (!F.all_(fa, p)) return true;

    const negationExists = F.any_(fa, x => !p(x));
    return !negationExists && (F.isEmpty(fa) || F.any_(fa, p));
  },

  anyLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.any_(fa, () => {
      i += 1;
      return true;
    });
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  allLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.all_(fa, () => {
      i += 1;
      return false;
    });
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  allEmpty: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean): boolean =>
    !F.isEmpty(fa) || F.all_(fa, p),

  nonEmptyRef: <A>(fa: Kind<F, [A]>): IsEq<boolean> =>
    new IsEq(F.nonEmpty(fa), !F.isEmpty(fa)),

  elemRef: <A>(fa: Kind<F, [A]>, idx: number): IsEq<Option<A>> => {
    const ref = <A>(fa: Kind<F, [A]>, idx: number) => {
      if (idx < 0) return None;
      return F.foldM_(Either.Monad<A>())(fa, 0, (i, a) =>
        i === idx ? Left(a) : Right(i + 1),
      ).fold(
        a => Some(a),
        () => None,
      );
    };

    return new IsEq(F.elem_(fa, idx), ref(fa, idx));
  },

  toListRef: <A>(fa: Kind<F, [A]>): IsEq<List<A>> => {
    const ref = <A>(fa: Kind<F, [A]>) =>
      List.fromArray(
        F.foldLeft_(fa, [] as A[], (as, a) => {
          as.push(a);
          return as;
        }),
      );

    return new IsEq(F.toList(fa), ref(fa));
  },

  toVectorRef: <A>(fa: Kind<F, [A]>): IsEq<Vector<A>> => {
    const ref = <A>(fa: Kind<F, [A]>) =>
      Vector.fromArray(
        F.foldLeft_(fa, [] as A[], (as, a) => {
          as.push(a);
          return as;
        }),
      );

    return new IsEq(F.toVector(fa), ref(fa));
  },

  listFromIteratorIsToList: <A>(fa: Kind<F, [A]>): IsEq<List<A>> =>
    new IsEq(List.fromIterator(F.iterator(fa)), F.toList(fa)),
});

export interface FoldableLaws<F> {
  foldRightLazy: <A>(fa: Kind<F, [A]>) => boolean;

  leftFoldConsistentWithFoldMap: <B>(
    B: Monoid<B>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => B) => IsEq<B>;

  rightFoldConsistentWithFoldMap: <B>(
    B: Monoid<B>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => B) => IsEq<B>;

  foldMapKConsistentWithFoldMap: <G>(
    G: MonoidK<G>,
  ) => <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<G, [B]>,
  ) => IsEq<Kind<G, [B]>>;

  foldMIdentity: <A, B>(
    fa: Kind<F, [A]>,
    b: B,
    f: (b: B, a: A) => B,
  ) => IsEq<B>;

  allConsistentWithAny: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;

  anyLazy: <A>(fa: Kind<F, [A]>) => boolean;

  allLazy: <A>(fa: Kind<F, [A]>) => boolean;

  allEmpty: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;

  nonEmptyRef: <A>(fa: Kind<F, [A]>) => IsEq<boolean>;

  elemRef: <A>(fa: Kind<F, [A]>, idx: number) => IsEq<Option<A>>;

  toListRef: <A>(fa: Kind<F, [A]>) => IsEq<List<A>>;
  toVectorRef: <A>(fa: Kind<F, [A]>) => IsEq<Vector<A>>;

  listFromIteratorIsToList: <A>(fa: Kind<F, [A]>) => IsEq<List<A>>;
}
