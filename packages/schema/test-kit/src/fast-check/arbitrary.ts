// Copyright (c) 2021-2023 Peter Matta
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
  get Schemable(): Schemable<ArbitraryF> {
    return arbitrarySchemable();
  },
  get Refining(): Refining<ArbitraryF> {
    return arbitraryRefining();
  },
  get Constraining(): Constraining<ArbitraryF> {
    return arbitraryConstraining();
  },
};

// -- HKT

export interface ArbitraryF extends TyK<[unknown]> {
  [$type]: Arbitrary<TyVar<this, 0>>;
}
