// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { List, Option } from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect';
import { BrandOwner, BrandOwnerId } from '../../domain/inventory/brand-owner';
import { Brand, BrandId, BrandRepository } from '../../domain/inventory/brand';

export class InMemoryBrandRepository<F> implements BrandRepository<F> {
  public constructor(
    private readonly F: Sync<F>,
    private readonly store: Record<string, Brand> = {},
  ) {}

  public findById(id: BrandId): Kind<F, [Option<Brand>]> {
    return this.F.pure(Option(this.store[BrandId.toString(id)]));
  }

  public findAllByOwner(owner: BrandOwner): Kind<F, [List<Brand>]> {
    return this.F.delay(() =>
      List.fromArray(
        Object.values(this.store).filter(b =>
          BrandOwnerId.Eq.equals(owner.id, b.owner),
        ),
      ),
    );
  }

  public save(brand: Brand): Kind<F, [Brand]> {
    return this.F.delay(() => {
      this.store[BrandId.toString(brand.id)] = brand;
      return brand;
    });
  }
}
