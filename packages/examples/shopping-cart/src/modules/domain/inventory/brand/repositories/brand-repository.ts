// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { List, Option } from '@fp4ts/cats';
import { Brand } from '../brand';
import { BrandId } from '../values';
import { BrandOwner } from '../../brand-owner';

export interface BrandRepository<F> {
  findById(brandId: BrandId): Kind<F, [Option<Brand>]>;
  findAllByOwner(owner: BrandOwner): Kind<F, [List<Brand>]>;

  save(brand: Brand): Kind<F, [Brand]>;
}
