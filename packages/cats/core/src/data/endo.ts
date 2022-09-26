// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monoid } from '@fp4ts/cats-kernel';
import { $type, id, Lazy, lazyVal, TyK, TyVar } from '@fp4ts/core';
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
}

const endoMonoidK: Lazy<MonoidK<EndoF>> = lazyVal(() => {
  const self: MonoidK<EndoF> = MonoidK.of({
    emptyK: <A>() => id<A>,
    combineK_: <A>(x: Endo<A>, y: Lazy<Endo<A>>) =>
      AndThen(x).compose((x: A) => y()(x)),
    algebra: lazyVal(<A>() => {
      const that: Monoid<Endo<A>> = Monoid.of<Endo<A>>({
        empty: id,
        combine_: self.combineK_,
        dual: () =>
          Monoid.of<Endo<A>>({
            empty: id,
            combine_: (x, y) => AndThen(x).andThen(y()),
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

// -- HKT

export interface EndoF extends TyK<[unknown]> {
  [$type]: Endo<TyVar<this, 0>>;
}
