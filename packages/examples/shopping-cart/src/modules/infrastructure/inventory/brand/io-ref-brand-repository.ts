// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Option } from '@fp4ts/cats';
import { IO, IOF, Ref } from '@fp4ts/effect';
import {
  Brand,
  BrandId,
  BrandRepository,
} from '../../../domain/inventory/brand';
import { BrandOwner } from '../../../domain/inventory/brand-owner';

export class IORefBrandRepository implements BrandRepository<IOF> {
  public static make = (): IO<IORefBrandRepository> =>
    IO.ref({} as Record<string, Brand>).map(
      store => new IORefBrandRepository(store),
    );

  private constructor(
    private readonly store: Ref<IOF, Record<string, Brand>>,
  ) {}

  public findById(id: BrandId): IO<Option<Brand>> {
    return this.store.get().map(store => Option(store[BrandId.toString(id)]));
  }

  public findAllByOwner(owner: BrandOwner): IO<List<Brand>> {
    return this.store
      .get()
      .map(store =>
        List.fromArray(Object.values(store).filter(b => b.owner === owner.id)),
      );
  }

  public save(Brand: Brand): IO<Brand> {
    const plainId = BrandId.toString(Brand.id);
    return this.store
      .update(Brands => ({ ...Brands, [plainId]: Brand }))
      .map(() => Brand);
  }
}
