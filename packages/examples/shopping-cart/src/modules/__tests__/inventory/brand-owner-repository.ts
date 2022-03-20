// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Option } from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect';
import {
  BrandOwner,
  BrandOwnerId,
  BrandOwnerRepository,
} from '../../domain/inventory/brand-owner';

export class InMemoryBrandOwnerRepository<F>
  implements BrandOwnerRepository<F>
{
  public constructor(
    private readonly F: Sync<F>,
    private readonly store: Record<string, BrandOwner> = {},
  ) {}

  public findById(id: BrandOwnerId): Kind<F, [Option<BrandOwner>]> {
    return this.F.delay(() => Option(this.store[BrandOwnerId.toString(id)]));
  }

  public save(owner: BrandOwner): Kind<F, [BrandOwner]> {
    const { F } = this;
    return F.delay(() => {
      this.store[BrandOwnerId.toString(owner.id)] = owner;
      return owner;
    });
  }
}
