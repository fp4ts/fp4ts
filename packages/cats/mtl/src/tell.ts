// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats-core';

export interface Tell<F, W> extends Functor<F> {
  tell(w: W): Kind<F, [void]>;

  writer(w: W): <A>(a: A) => Kind<F, [A]>;
  writer_<A>(a: A, w: W): Kind<F, [A]>;
}
