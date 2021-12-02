// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';

export class IndexedStateT<F, SA, SB, A> {
  public constructor(
    public readonly runF: Kind<F, [(sa: SA) => Kind<F, [[SB, A]]>]>,
  ) {}
}
