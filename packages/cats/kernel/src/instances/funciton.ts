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
      combineEval_: (x, ey) =>
        Eval.now(
          F0.map(
            x,
            x =>
              S.combineEval_(
                x,
                ey.map(y => y()),
              ).value,
          ),
        ),
    }),
);

export const function0CommutativeSemigroup = cached(
  <A>(S: CommutativeSemigroup<A>): CommutativeSemigroup<() => A> => {
    const FS = function0Semigroup(S);
    return CommutativeSemigroup.of({
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
    });
  },
);

export const function0Monoid = cached(<A>(S: Monoid<A>): Monoid<() => A> => {
  const FS = function0Semigroup(S);
  return Monoid.of({
    empty: () => S.empty,
    combine_: FS.combine_,
    combineEval_: FS.combineEval_,
  });
});

export const function0CommutativeMonoid = cached(
  <A>(S: CommutativeMonoid<A>): CommutativeMonoid<() => A> => {
    const FS = function0Semigroup(S);
    return CommutativeMonoid.of({
      empty: () => S.empty,
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
    });
  },
);

// -- Function1

export const function1Semigroup = cached(
  <A, B>(S: Semigroup<B>): Semigroup<(a: A) => B> =>
    Semigroup.of({
      combine_: (x, y) =>
        F1.flatMap(x, x => F1.andThen(y, y => S.combine_(x, y))),
      combineEval_: (x, ey) =>
        Eval.now(
          (a: A) =>
            S.combineEval_(
              x(a),
              ey.map(y => y(a)),
            ).value,
        ),
    }),
);

export const function1CommutativeSemigroup = cached(
  <A, B>(S: CommutativeSemigroup<B>): CommutativeSemigroup<(a: A) => B> => {
    const FS = function1Semigroup<A, B>(S);
    return CommutativeSemigroup.of({
      combine_: FS.combine_,
      combineEval_: FS.combineEval_,
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
    });
  },
);

export const endoMonoid = lazy(
  <A>(): Monoid<(a: A) => A> =>
    Monoid.of({
      empty: id<A>,
      combine_: F1.compose,
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
