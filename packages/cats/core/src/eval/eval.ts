// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, HKT, TyK, TyVar } from '@fp4ts/core';
import { Eq, Semigroup, Monoid } from '@fp4ts/cats-kernel';
import { Defer } from '../defer';
import { Functor } from '../functor';
import { Apply } from '../apply';
import { Applicative } from '../applicative';
import { FlatMap } from '../flat-map';
import { CoflatMap } from '../coflat-map';

import { Eval as EvalBase, Now } from './algebra';
import { always, defer, delay, later, now, pure, unit } from './constructors';
import {
  evalApplicative,
  evalApply,
  evalCoflatMap,
  evalDefer,
  evalEq,
  evalEqK,
  evalFlatMap,
  evalFunctor,
  evalMonad,
  evalMonoid,
  evalSemigroup,
} from './instances';
import { EqK } from '../eq-k';
import { StackSafeMonad } from '../stack-safe-monad';

export type Eval<A> = EvalBase<A>;

export const Eval: EvalObj = function <A>(x: A): Eval<A> {
  return new Now(x);
} as any;

interface EvalObj {
  <A>(x: A): Eval<A>;
  pure<A>(a: A): Eval<A>;
  now<A>(a: A): Eval<A>;
  unit: Eval<void>;
  always<A>(thunk: () => A): Eval<A>;
  later<A>(thunk: () => A): Eval<A>;
  delay<A>(thunk: () => A): Eval<A>;
  defer<A>(thunk: () => Eval<A>): Eval<A>;

  void: Eval<void>;
  false: Eval<boolean>;
  true: Eval<boolean>;
  zero: Eval<number>;
  one: Eval<number>;

  // -- Instances

  readonly EqK: EqK<EvalF>;
  readonly Defer: Defer<EvalF>;
  readonly Functor: Functor<EvalF>;
  readonly Apply: Apply<EvalF>;
  readonly Applicative: Applicative<EvalF>;
  readonly FlatMap: FlatMap<EvalF>;
  readonly CoflatMap: CoflatMap<EvalF>;
  readonly Monad: StackSafeMonad<EvalF>;

  Eq<A>(E: Eq<A>): Eq<Eval<A>>;
  Semigroup<S>(S: Semigroup<S>): Semigroup<Eval<S>>;
  Monoid<M>(S: Monoid<M>): Monoid<Eval<M>>;
}

Eval.pure = pure;
Eval.now = now;
Eval.unit = unit;
Eval.always = always;
Eval.later = later;
Eval.delay = delay;
Eval.defer = defer;

Eval.void = new Now(undefined);
Eval.false = new Now(false);
Eval.true = new Now(true);
Eval.zero = new Now(0);
Eval.one = new Now(1);

Object.defineProperty(Eval, 'EqK', {
  get() {
    return evalEqK();
  },
});
Object.defineProperty(Eval, 'Defer', {
  get() {
    return evalDefer();
  },
});
Object.defineProperty(Eval, 'Functor', {
  get() {
    return evalFunctor();
  },
});
Object.defineProperty(Eval, 'Apply', {
  get() {
    return evalApply();
  },
});
Object.defineProperty(Eval, 'Applicative', {
  get() {
    return evalApplicative();
  },
});
Object.defineProperty(Eval, 'FlatMap', {
  get() {
    return evalFlatMap();
  },
});
Object.defineProperty(Eval, 'CoflatMap', {
  get() {
    return evalCoflatMap();
  },
});
Object.defineProperty(Eval, 'Monad', {
  get() {
    return evalMonad();
  },
});

Eval.Eq = evalEq;
Eval.Semigroup = evalSemigroup;
Eval.Monoid = evalMonoid;

// -- HKT

declare module './algebra' {
  export interface Eval<A> extends HKT<EvalF, [A]> {}
}

/**
 * @category Type Constructor
 */
export interface EvalF extends TyK<[unknown]> {
  [$type]: Eval<TyVar<this, 0>>;
}
