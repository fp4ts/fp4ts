// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Defer, Foldable, MonoidK } from '@fp4ts/cats-core';
import {
  Identity,
  Option,
  Some,
  None,
  Either,
  Left,
  Right,
  Iter,
} from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

export const FoldableLaws = <F>(F: Foldable<F>) => ({
  foldRightLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.foldRight_(fa, Eval.now('empty'), () => {
      i += 1;
      return Eval.now('not empty');
    }).value;
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  foldRightDeferLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.foldRightDefer_(
      Defer.Function0,
      fa,
      () => 'empty',
      () => {
        i += 1;
        return () => 'not empty';
      },
    )();
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  foldRightConsistentWithFoldRightDeferEval: <A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): IsEq<B> =>
    new IsEq(
      F.foldRight_(fa, Eval.now(z), f).value,
      F.foldRightDefer_(Defer.Eval, fa, Eval.now(z), f).value,
    ),

  leftFoldConsistentWithFoldMapLeft:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A) => B): IsEq<B> =>
      new IsEq(
        F.foldMapLeft_(B)(fa, f),
        F.foldLeft_(fa, B.empty, (b, a) => B.combine_(b, f(a))),
      ),

  rightFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A) => B): IsEq<B> =>
      new IsEq(
        F.foldMap_(B)(fa, f),
        F.foldRight_(fa, Eval.now(B.empty), (a, eb) =>
          B.combineEval_(f(a), eb),
        ).value,
      ),

  foldMapConsistentWithRightFold: <A, B>(
    fa: Kind<F, [A]>,
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>) => Eval<B>,
  ): IsEq<B> =>
    new IsEq(
      F.foldRight_(fa, ez, f).value,
      F.foldMap_(MonoidK.EndoEval.algebra<B>())(
        fa,
        a => (eb: Eval<B>) => f(a, eb),
      )(ez).value,
    ),

  foldMapConsistentWithLeftFold: <A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (b: B, a: A) => B,
  ): IsEq<B> =>
    new IsEq(
      F.foldLeft_(fa, z, f),
      F.foldMap_(MonoidK.Endo.algebra<B>().dual())(fa, a => (b: B) => f(b, a))(
        z,
      ),
    ),

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

  toArrayRef: <A>(fa: Kind<F, [A]>): IsEq<A[]> => {
    const ref = <A>(fa: Kind<F, [A]>) =>
      F.foldLeft_(fa, [] as A[], (as, a) => {
        as.push(a);
        return as;
      });

    return new IsEq(F.toArray(fa), ref(fa));
  },

  arrayFromIteratorIsToArray: <A>(fa: Kind<F, [A]>): IsEq<A[]> =>
    new IsEq(Iter.toArray(F.iterator(fa)), F.toArray(fa)),
});
