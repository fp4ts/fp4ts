// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IxStateTAlgebra } from './ix-state-t';
import { RWSAlgebra } from './rws';
import { StateTAlgebra } from './state-t';

/**
 * Carriers for the `State` effect.
 */
export const StateC = Object.freeze({
  IxStateT: IxStateTAlgebra,
  StateT: StateTAlgebra,
  RWS: RWSAlgebra,
});
