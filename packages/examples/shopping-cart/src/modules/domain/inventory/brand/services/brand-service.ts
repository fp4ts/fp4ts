// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats';
import { GenUUID } from '../../../../../common';

import { BrandOwner } from '../../brand-owner';
import { Brand } from '../brand';
import { BrandRepository } from '../repositories';
import { BrandId, BrandName } from '../values';

export class BrandService<F> {
  public constructor(
    private readonly F: Monad<F> & GenUUID<F>,
    private readonly repo: BrandRepository<F>,
  ) {}

  public createBrand(owner: BrandOwner, name: BrandName): Kind<F, [Brand]> {
    const { F, repo } = this;
    return F.do(function* (_) {
      const uuid = yield* _(F.genUUID);

      const brandId = BrandId(uuid);

      const brand = Brand(brandId, name, owner);

      return yield* _(repo.save(brand));
    });
  }

  public enableBrand(brand: Brand): Kind<F, [Brand]> {
    return this.repo.save({ ...brand, active: true });
  }

  public disableBrand(brand: Brand): Kind<F, [Brand]> {
    return this.repo.save({ ...brand, active: false });
  }
}
