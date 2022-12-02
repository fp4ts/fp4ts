// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Function1Algebra } from './function1';
import { KleisliAlgebra } from './kleisli';

/**
 * Carriers for the `Reader` effect.
 */
export const ReaderC = Object.freeze({
  Kleisli: KleisliAlgebra,
  Function1: Function1Algebra,
});
