// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative } from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Kind } from '@fp4ts/core';
import { Listen } from './listen';

export interface Censor<F, W> extends Applicative<F>, Listen<F, W> {
  readonly monoid: Monoid<W>;

  censor(f: (w: W) => W): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  censor_<A>(fa: Kind<F, [A]>, f: (w: W) => W): Kind<F, [A]>;

  clear<A>(fa: Kind<F, [A]>): Kind<F, [A]>;
}
