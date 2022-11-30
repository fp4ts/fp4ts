// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherAlgebra } from './either';
import { EitherTAlgebra } from './either-t';

/**
 * Carriers for the `Error` effect.
 */
export const ErrorC = Object.freeze({
  EitherT: EitherTAlgebra,
  Either: EitherAlgebra,
});