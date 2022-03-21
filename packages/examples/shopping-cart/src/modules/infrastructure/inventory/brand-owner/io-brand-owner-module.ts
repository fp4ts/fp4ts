// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF } from '@fp4ts/effect';

import { LoginApiService } from '../../../application/auth';
import { IOAuthModule } from '../../auth';

import {
  BrandOwnerRepository,
  BrandOwnerService,
} from '../../../domain/inventory/brand-owner';
import {
  BrandOwnerApiService,
  CreateBrandOwnerApiService,
} from '../../../application/inventory/brand-owner';

import { IORefBrandOwnerRepository } from './io-ref-brand-owner-repository';

export class IOBrandOwnerModule {
  public static make(authModule: IOAuthModule): IO<IOBrandOwnerModule> {
    return IO.Monad.do(function* (_) {
      const F = IO.Concurrent;
      const repo = yield* _(IORefBrandOwnerRepository.make());
      const service = new BrandOwnerService(F, repo);

      const loginApi = new LoginApiService(F, authModule.authenticationService);

      const apiService = new BrandOwnerApiService(
        F,
        loginApi,
        new CreateBrandOwnerApiService(F, service),
      );

      return new IOBrandOwnerModule(apiService, service, repo);
    });
  }

  private constructor(
    public readonly apiService: BrandOwnerApiService<IOF>,
    public readonly brandOwnerService: BrandOwnerService<IOF>,
    public readonly brandOwnerRepository: BrandOwnerRepository<IOF>,
  ) {}
}
