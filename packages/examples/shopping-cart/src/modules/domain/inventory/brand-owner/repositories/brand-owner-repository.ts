// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Option } from '@fp4ts/cats';

import { BrandOwnerId } from '../values';
import { BrandOwner } from '../brand-owner';

export interface BrandOwnerRepository<F> {
  findById(id: BrandOwnerId): Kind<F, [Option<BrandOwner>]>;
  save(owner: BrandOwner): Kind<F, [BrandOwner]>;
}
