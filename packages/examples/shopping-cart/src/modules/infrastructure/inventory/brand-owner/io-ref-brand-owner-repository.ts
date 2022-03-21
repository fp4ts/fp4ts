// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';
import { IO, IOF, Ref } from '@fp4ts/effect';
import {
  BrandOwner,
  BrandOwnerId,
  BrandOwnerRepository,
} from '../../../domain/inventory/brand-owner';

export class IORefBrandOwnerRepository implements BrandOwnerRepository<IOF> {
  public static make = (): IO<IORefBrandOwnerRepository> =>
    IO.ref({} as Record<string, BrandOwner>).map(
      store => new IORefBrandOwnerRepository(store),
    );

  private constructor(
    private readonly store: Ref<IOF, Record<string, BrandOwner>>,
  ) {}

  public findById(id: BrandOwnerId): IO<Option<BrandOwner>> {
    return this.store
      .get()
      .map(store => Option(store[BrandOwnerId.toString(id)]));
  }

  public save(owner: BrandOwner): IO<BrandOwner> {
    const plainId = BrandOwnerId.toString(owner.id);
    return this.store
      .update(owners => ({ ...owners, [plainId]: owner }))
      .map(() => owner);
  }
}
