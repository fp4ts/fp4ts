// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';

import { Free as FreeBase } from './algebra';
import { pure, suspend } from './constructors';
import { freeMonad } from './instances';

export type Free<F, A> = FreeBase<F, A>;

export const Free: FreeObj = function <F, A>(a: A): Free<F, A> {
  return pure(a);
};

interface FreeObj {
  <F, A>(a: A): Free<F, A>;
  pure<F, A>(a: A): Free<F, A>;
  suspend<F, A>(a: Kind<F, [A]>): Free<F, A>;

  Monad<F>(): Monad<$<FreeK, [F]>>;
}

Free.pure = pure;
Free.suspend = suspend;
Free.Monad = freeMonad;

// HKT

export interface FreeK extends TyK<[unknown, unknown]> {
  [$type]: Free<TyVar<this, 0>, TyVar<this, 1>>;
}
