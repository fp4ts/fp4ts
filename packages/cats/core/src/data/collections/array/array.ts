// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';

// HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface ArrayF extends TyK<[unknown]> {
  [$type]: Array<TyVar<this, 0>>;
}
