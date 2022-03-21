// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF } from '@fp4ts/effect';
import { GenUUID } from '../../../common';
import {
  InventoryApiService,
  OwnerAuthApiService,
} from '../../application/inventory';
import { IOAuthModule } from '../auth';

import { IOBrandModule } from './brand';
import { IOBrandOwnerModule } from './brand-owner';

export class IOInventoryModule {
  public static make(
    G: GenUUID<IOF>,
    authModule: IOAuthModule,
  ): IO<IOInventoryModule> {
    return IO.Monad.do(function* (_) {
      const F = IO.Concurrent;
      const brandModule = yield* _(IOBrandModule.make(G));
      const brandOwnerModule = yield* _(IOBrandOwnerModule.make(authModule));

      const oam = new OwnerAuthApiService(
        F,
        authModule.authenticationService,
        brandOwnerModule.brandOwnerRepository,
      );

      const apiService = new InventoryApiService(
        F,
        oam,
        brandModule.apiService,
        brandOwnerModule.apiService,
      );

      return new IOInventoryModule(apiService, oam);
    });
  }

  private constructor(
    public readonly apiService: InventoryApiService<IOF>,
    public readonly ownerAuthApi: OwnerAuthApiService<IOF>,
  ) {}
}
