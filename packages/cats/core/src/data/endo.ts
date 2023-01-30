// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monoid } from '@fp4ts/cats-kernel';
import { $type, Eval, EvalF, id, Lazy, lazy, TyK, TyVar } from '@fp4ts/core';
import { MonoidK } from '../monoid-k';
import { AndThen } from './and-then';

export type Endo<A> = (a: A) => A;

export const Endo: EndoObj = function <A>(f: (a: A) => A): Endo<A> {
  return f;
} as any;

interface EndoObj {
  <A>(f: (a: A) => A): Endo<A>;

  // -- Instances

  readonly MonoidK: MonoidK<EndoF>;

  readonly EvalMonoidK: MonoidK<[EndoF, EvalF]>;
}

const endoMonoidK: Lazy<MonoidK<EndoF>> = lazy(() => {
  const self: MonoidK<EndoF> = MonoidK.of({
    emptyK: <A>() => id<A>,
    combineK_: <A>(f: Endo<A>, g: Endo<A>) => AndThen(g).andThen(f),
    algebra: lazy(<A>() => {
      const that: Monoid<Endo<A>> = Monoid.of<Endo<A>>({
        empty: id,
        combine_: self.combineK_,
        dual: () =>
          Monoid.of<Endo<A>>({
            empty: id,
            combine_: (f, g) => AndThen(f).andThen(g),
            dual: () => that,
          }),
      });
      return that;
    }) as <A>() => Monoid<Endo<A>>,
  });
  return self;
});

const endoEvalMonoidK: Lazy<MonoidK<[EndoF, EvalF]>> = lazy(() => {
  const self: MonoidK<[EndoF, EvalF]> = MonoidK.of({
    emptyK: <A>() => id<A>,

    combineK_:
      <A>(f: Endo<Eval<A>>, g: Endo<Eval<A>>) =>
      (ea: Eval<A>) =>
        Eval.defer(() => f(g(ea))),

    combineKEval_: <A>(f: Endo<Eval<A>>, eg: Eval<Endo<Eval<A>>>) =>
      Eval.now((eb: Eval<A>) => f(eg.flatMap(g => g(eb)))),

    algebra: lazy(<A>() => {
      const that: Monoid<Endo<Eval<A>>> = Monoid.of<Endo<Eval<A>>>({
        empty: id,
        combine_: self.combineK_,
        combineEval_: self.combineKEval_,
        dual: () =>
          Monoid.of<Endo<Eval<A>>>({
            empty: id,
            combine_: (f, g) => ea => Eval.defer(() => g(f(ea))),
            dual: () => that,
          }),
      });
      return that;
    }) as <A>() => Monoid<Endo<A>>,
  });
  return self;
});

Object.defineProperty(Endo, 'MonoidK', {
  get(): MonoidK<EndoF> {
    return endoMonoidK();
  },
});

Object.defineProperty(Endo, 'EvalMonoidK', {
  get(): MonoidK<[EndoF, EvalF]> {
    return endoEvalMonoidK();
  },
});

// -- HKT

export interface EndoF extends TyK<[unknown]> {
  [$type]: Endo<TyVar<this, 0>>;
}
