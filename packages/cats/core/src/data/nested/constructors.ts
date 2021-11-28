// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Nested } from './algebra';

export const liftF = <F, G, A>(fga: Kind<F, [Kind<G, [A]>]>): Nested<F, G, A> =>
  new Nested(fga);
