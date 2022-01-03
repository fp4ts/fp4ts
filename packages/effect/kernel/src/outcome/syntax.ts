// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { Outcome } from './algebra';
import { fold_, mapK_ } from './operators';

declare module './algebra' {
  interface Outcome<F, E, A> {
    mapK<G>(nt: FunctionK<F, G>): Outcome<G, E, A>;

    fold<B1, B2 = B1, B3 = B2>(
      onCancel: () => B1,
      onFailure: (e: E) => B2,
      onSuccess: (fa: Kind<F, [A]>) => B3,
    ): B1 | B2 | B3;
  }
}

Outcome.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};

Outcome.prototype.fold = function (onCancel, onFailure, onSuccess) {
  return fold_(this, onCancel, onFailure, onSuccess);
};
