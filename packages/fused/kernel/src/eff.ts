// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';

export type Eff<Sig, G, A> = {
  [k in keyof Sig]: { tag: k; eff: Kind<Sig[k], [G, A]> };
}[keyof Sig];
