// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { IO, IOF } from '@fp4ts/effect';

import {
  BrandName,
  BrandRepository,
  BrandService,
} from '../../../domain/inventory/brand';

import { InMemoryBrandRepository } from '../brand-repository';
import { UUID } from '../../../../common';
import {
  BrandOwner,
  BrandOwnerId,
} from '../../../domain/inventory/brand-owner';
import { List } from '@fp4ts/cats';

describe('Brand creation', () => {
  let brandRepo: BrandRepository<IOF>;
  let brandService: BrandService<IOF>;

  beforeEach(() => {
    let id = 0;
    brandRepo = new InMemoryBrandRepository(IO.Sync);
    brandService = new BrandService(
      {
        ...IO.Monad,
        genUUID: IO.delay(() => UUID.unsafeFromString(`${++id}`)),
      },
      brandRepo,
    );
  });

  const brandOwner = BrandOwner(BrandOwnerId(UUID.unsafeFromString('12345')));

  it.M('should list the created brand for the given owner', () =>
    IO.Monad.do(function* (_) {
      const brand = yield* _(
        brandService.createBrand(brandOwner, BrandName.unsafeFromString('fst')),
      );

      const brands = yield* _(brandRepo.findAllByOwner(brandOwner));

      expect(brands).toEqual(List(brand));
    }),
  );

  it.M('should list all created brands for the given owner', () =>
    IO.Monad.do(function* (_) {
      const brands = yield* _(
        IO.traverse_(List.Traversable)(List('fst', 'snd', 'thr'), n =>
          brandService.createBrand(brandOwner, BrandName.unsafeFromString(n)),
        ),
      );

      const brands_ = yield* _(brandRepo.findAllByOwner(brandOwner));

      expect(brands_.toArray).toEqual(expect.arrayContaining(brands.toArray));
    }),
  );
});
