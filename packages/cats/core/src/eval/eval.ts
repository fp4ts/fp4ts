import { TyK, _ } from '@cats4ts/core';
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
  evalFlatMap,
  evalFunctor,
  evalMonad,
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

// -- HKT

const EvalURI = '@cats4ts/cats/core/eval';
type EvalURI = typeof EvalURI;
export type EvalK = TyK<EvalURI, [_]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [EvalURI]: Eval<Tys[0]>;
  }
}
