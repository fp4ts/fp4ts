// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '../eq';
import { Semigroup } from '../semigroup';
import { Monoid } from '../monoid';
import { Defer } from '../defer';
import { Functor } from '../functor';
import { Apply } from '../apply';
import { Applicative } from '../applicative';
import { FlatMap } from '../flat-map';
import { Monad } from '../monad';

import { Eval as EvalBase, Now } from './algebra';
import { always, defer, delay, later, now, pure, unit } from './constructors';
import {
  evalApplicative,
  evalApply,
  evalDefer,
  evalEq,
  evalFlatMap,
  evalFunctor,
  evalMonad,
  evalMonoid,
  evalSemigroup,
} from './instances';

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

  // -- Instances

  readonly Defer: Defer<EvalK>;
  readonly Functor: Functor<EvalK>;
  readonly Apply: Apply<EvalK>;
  readonly Applicative: Applicative<EvalK>;
  readonly FlatMap: FlatMap<EvalK>;
  readonly Monad: Monad<EvalK>;

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
Object.defineProperty(Eval, 'Monad', {
  get() {
    return evalMonad();
  },
});

Eval.Eq = evalEq;
Eval.Semigroup = evalSemigroup;
Eval.Monoid = evalMonoid;

// -- HKT

/**
 * @category Type Constructor
 */
export interface EvalK extends TyK<[unknown]> {
  [$type]: Eval<TyVar<this, 0>>;
}
