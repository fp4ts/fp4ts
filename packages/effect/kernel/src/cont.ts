// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK, Either } from '@fp4ts/cats';
import { MonadCancel } from './monad-cancel';

export interface Cont<F, K, R, E = Error> {
  <G>(G: MonadCancel<G, E>): (
    k: (ea: Either<E, K>) => void,
    get: Kind<G, [K]>,
    nt: FunctionK<F, G>,
  ) => Kind<G, [R]>;
}
