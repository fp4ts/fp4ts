// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';

export interface MonadState<F, S> extends Monad<F> {
  get: Kind<F, [S]>;
  set(s: S): Kind<F, [void]>;

  modify(f: (s: S) => S): Kind<F, [void]>;
  inspect<A>(f: (s: S) => A): Kind<F, [A]>;
}
