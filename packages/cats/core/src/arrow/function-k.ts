// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';

export interface FunctionK<F, G> {
  <A>(fa: Kind<F, [A]>): Kind<G, [A]>;
}
export const FunctionK = Object.freeze({
  id: <F>(): FunctionK<F, F> => id,
});
