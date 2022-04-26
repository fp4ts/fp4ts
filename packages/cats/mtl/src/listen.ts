// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Tell } from './tell';

export interface Listen<F, W> extends Tell<F, W> {
  listen<A>(fa: Kind<F, [A]>): Kind<F, [[A, W]]>;
}
