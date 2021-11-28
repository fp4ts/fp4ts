// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FunctionK } from '../../arrow';
import { Nested } from './algebra';

export const mapK: <F, H, A>(
  nt: FunctionK<F, H>,
) => <G>(fa: Nested<F, G, A>) => Nested<H, G, A> = nt => fa => mapK_(fa, nt);

export const mapK_ = <F, G, H, A>(
  fa: Nested<F, G, A>,
  nt: FunctionK<F, H>,
): Nested<H, G, A> => new Nested(nt(fa.value));
