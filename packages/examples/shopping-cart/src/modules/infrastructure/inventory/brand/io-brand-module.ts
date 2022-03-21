// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF } from '@fp4ts/effect';

import { GenUUID } from '../../../../common';

import { BrandApiService } from '../../../application/inventory/brand';
import { BrandService } from '../../../domain/inventory/brand';

import { IORefBrandRepository } from './io-ref-brand-repository';

export class IOBrandModule {
  public static make(G: GenUUID<IOF>): IO<IOBrandModule> {
    return IO.Monad.do(function* (_) {
      const F = { ...IO.Monad, ...G };
      const repo = yield* _(IORefBrandRepository.make());
      const service = new BrandService(F, repo);

      const apiService = new BrandApiService(F, service, repo);

      return new IOBrandModule(apiService, service);
    });
  }

  private constructor(
    public readonly apiService: BrandApiService<IOF>,
    public readonly brandService: BrandService<IOF>,
  ) {}
}
