// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ChurchAlgebra } from './church';
import { WriterTAlgebra } from './writer-t';

/**
 * Carriers for the `Writer` effect.
 */
export const WriterC = Object.freeze({
  WriterT: WriterTAlgebra,
  Church: ChurchAlgebra,
});
