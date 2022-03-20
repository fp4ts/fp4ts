// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherT, Left, Monad, Right } from '@fp4ts/cats';
import { MessageFailure, NotFoundFailure, ParsingFailure } from '@fp4ts/http';
import {
  Brand,
  BrandId,
  BrandName,
  BrandRepository,
  BrandService,
} from '../../../domain/inventory/brand';
import { BrandOwner } from '../../../domain/inventory/brand-owner';
import { CreateBrandDto } from './dto';

export class BrandApiService<F> {
  public constructor(
    private readonly F: Monad<F>,
    private readonly service: BrandService<F>,
    private readonly repo: BrandRepository<F>,
  ) {}

  public createBrand(
    owner: BrandOwner,
    { name }: CreateBrandDto,
  ): EitherT<F, MessageFailure, Brand> {
    return BrandName(name).fold(
      () =>
        EitherT.left(this.F)(new ParsingFailure('Brand name cannot be empty')),
      name => EitherT.liftF(this.F)(this.service.createBrand(owner, name)),
    );
  }

  public enableBrand(brandId: BrandId): EitherT<F, MessageFailure, Brand> {
    return this.withBrand(brandId)(brand =>
      EitherT.liftF(this.F)(this.service.enableBrand(brand)),
    );
  }

  public disableBrand(brandId: BrandId): EitherT<F, MessageFailure, Brand> {
    return this.withBrand(brandId)(brand =>
      EitherT.liftF(this.F)(this.service.disableBrand(brand)),
    );
  }

  private withBrand(
    brandId: BrandId,
  ): <A>(
    f: (brand: Brand) => EitherT<F, MessageFailure, A>,
  ) => EitherT<F, MessageFailure, A> {
    return this.findBrand(brandId).flatMap(this.F);
  }

  private findBrand(brandId: BrandId): EitherT<F, MessageFailure, Brand> {
    return EitherT(
      this.F.map_(this.repo.findById(brandId), brand =>
        brand.fold(() => Left(this.BrandNotFound(brandId)), Right),
      ),
    );
  }

  private BrandNotFound(brandId: BrandId): MessageFailure {
    return new NotFoundFailure(`Brand with id ${brandId} was not found`);
  }
}
