// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { MonoidK } from '../../monoid-k';
import { endoMonoidK } from './instances';

export type Endo<A> = (a: A) => A;

export const Endo: EndoObj = function <A>(f: (a: A) => A): Endo<A> {
  return f;
} as any;

interface EndoObj {
  <A>(f: (a: A) => A): Endo<A>;

  // -- Instances
  readonly MonoidK: MonoidK<EndoF>;
}

Object.defineProperty(Endo, 'MonoidK', {
  get(): MonoidK<EndoF> {
    return endoMonoidK();
  },
});

// -- HKT

export interface EndoF extends TyK<[unknown]> {
  [$type]: Endo<TyVar<this, 0>>;
}
