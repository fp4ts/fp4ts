// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { cached, Eval, F0, F1, id, lazy } from '@fp4ts/core';
import { CommutativeMonoid } from '../commutative-monoid';
import { CommutativeSemigroup } from '../commutative-semigroup';
import { Eq } from '../eq';
import { Monoid } from '../monoid';
import { Ord } from '../ord';
import { Semigroup } from '../semigroup';

// -- Function0

export const function0Eq = cached(
  <A>(E: Eq<A>): Eq<() => A> => Eq.by(E, fx => fx()),
);

export const function0Ord = cached(
  <A>(O: Ord<A>): Ord<() => A> => Ord.by(O, fx => fx()),
);

export const function0Semigroup = cached(
  <A>(S: Semigroup<A>): Semigroup<() => A> =>
    Semigroup.of({
      combine_: (x, y) => F0.flatMap(x, x => F0.map(y, y => S.combine_(x, y))),
      combineEval_: (x, ey) => Eval.now(combine0(S.combineEval_, x, ey)),
      combineN_: (x, n) => F0.map(x, x => S.combineN_(x, n)),
    }),
);

export const function0CommutativeSemigroup = cached(
  <A>(S: CommutativeSemigroup<A>): CommutativeSemigroup<() => A> => {
    const FS = function0Semigroup(S);
    return CommutativeSemigroup.of({
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
      combineN_: (x, n) => F0.map(x, x => S.combineN_(x, n)),
    });
  },
);

export const function0Monoid = cached(<A>(S: Monoid<A>): Monoid<() => A> => {
  const FS = function0Semigroup(S);
  return Monoid.of({
    empty: () => S.empty,
    combine_: FS.combine_,
    combineEval_: FS.combineEval_,
    combineN_: (x, n) => F0.map(x, x => S.combineN_(x, n)),
  });
});

export const function0CommutativeMonoid = cached(
  <A>(S: CommutativeMonoid<A>): CommutativeMonoid<() => A> => {
    const FS = function0Semigroup(S);
    return CommutativeMonoid.of({
      empty: () => S.empty,
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
      combineN_: (x, n) => F0.map(x, x => S.combineN_(x, n)),
    });
  },
);

// -- Function1

export const function1Semigroup = cached(
  <A, B>(S: Semigroup<B>): Semigroup<(a: A) => B> =>
    Semigroup.of({
      combine_: (x, y) =>
        F1.flatMap(x, x => F1.andThen(y, y => S.combine_(x, y))),
      combineEval_: (x, ey) => Eval.now(F1.combineEval(x, ey, S.combineEval_)),
      combineN_: (x, n) => F1.andThen(x, x => S.combineN_(x, n)),
    }),
);

export const function1CommutativeSemigroup = cached(
  <A, B>(S: CommutativeSemigroup<B>): CommutativeSemigroup<(a: A) => B> => {
    const FS = function1Semigroup<A, B>(S);
    return CommutativeSemigroup.of({
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
      combineN_: (x, n) => F1.andThen(x, x => S.combineN_(x, n)),
    });
  },
);

export const function1Monoid = cached(
  <A, B>(S: Monoid<B>): Monoid<(a: A) => B> => {
    const FS = function1Semigroup<A, B>(S);
    return Monoid.of({
      empty: () => S.empty,
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
      combineN_: (x, n) => F1.andThen(x, x => S.combineN_(x, n)),
    });
  },
);

export const function1CommutativeMonoid = cached(
  <A, B>(S: CommutativeMonoid<B>): CommutativeMonoid<(a: A) => B> => {
    const FS = function1Semigroup<A, B>(S);
    return CommutativeMonoid.of({
      empty: () => S.empty,
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
      combineN_: (x, n) => F1.andThen(x, x => S.combineN_(x, n)),
    });
  },
);

export const endoMonoid = lazy(
  <A>(): Monoid<(a: A) => A> =>
    Monoid.of({
      empty: id<A>,
      combine_: F1.compose,
      combineEval_: (f, eg) =>
        Eval.now(
          F1.andThen(
            F1.defer(() => eg.value),
            f,
          ),
        ),
    }),
) as <A>() => Monoid<(a: A) => A>;

export const endoEvalMonoid = lazy(
  <A>(): Monoid<(a: Eval<A>) => Eval<A>> =>
    Monoid.of({
      empty: id<Eval<A>>,
      combine_: F1.compose,
      combineEval_: (f, eg) =>
        Eval.now((ez: Eval<A>) => f(eg.flatMap(g => g(ez)))),
    }),
) as <A>() => Monoid<(a: A) => A>;

function isCombine<A>(f: () => A): f is CombineFn0<A> {
  return combineTag in f;
}

const combineTag = Symbol('@fp4ts/cats-kernel/function/combine');

function combine0<A>(
  c: (b: A, eb: Eval<A>) => Eval<A>,
  lhs: () => A,
  rhs: Eval<() => A>,
): () => A {
  const apply = (() => runF0(c, apply).value) as CombineFn0<A>;
  apply[combineTag] = true;
  apply.lhs = lhs;
  apply.rhs = rhs;
  return apply;
}

interface CombineFn0<A> {
  (): A;
  [combineTag]: true;
  lhs: () => A;
  rhs: Eval<() => A>;
  f: (x: A, ey: Eval<A>) => Eval<A>;
}

function runF0<A>(c: (a: A, ea: Eval<A>) => Eval<A>, f: () => A): Eval<A> {
  const rhs: Eval<() => A>[] = [];
  const go = (f: () => A): Eval<A> => {
    while (isCombine(f)) {
      rhs.push(f.rhs);
      f = f.lhs;
    }
    return rhs.length
      ? Eval.defer(() =>
          c(
            f(),
            rhs.pop()!.flatMap(g => go(g)),
          ),
        )
      : Eval.now(f());
  };
  return go(f);
}
