// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { $type, TyK, TyVar } from '@fp4ts/core';
import {
  arbitraryConstraining,
  arbitraryRefining,
  arbitrarySchemable,
} from './instances';
import { Constraining, Refining, Schemable } from '@fp4ts/schema-kernel';

export const ArbitraryInstances = {
  get Schemable(): Schemable<ArbitraryK> {
    return arbitrarySchemable();
  },
  get Refining(): Refining<ArbitraryK> {
    return arbitraryRefining();
  },
  get Constraining(): Constraining<ArbitraryK> {
    return arbitraryConstraining();
  },
};

// -- HKT

export interface ArbitraryK extends TyK<[unknown]> {
  [$type]: Arbitrary<TyVar<this, 0>>;
}
