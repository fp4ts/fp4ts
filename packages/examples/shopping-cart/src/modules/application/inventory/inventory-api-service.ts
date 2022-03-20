// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Concurrent } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http';
import { builtins, toHttpApp } from '@fp4ts/http-dsl-server';
import { JsonCodec } from '@fp4ts/schema-json';

import { Brand } from '../../domain/inventory/brand';

import { BrandApiService, CreateBrandDto } from './brand';
import { BrandOwnerApiService } from './brand-owner';
import { InventoryApi } from './inventory-api';
import { OwnerAuthApiService } from './owner-auth-api-service';

export class InventoryApiService<F> {
  public constructor(
    private readonly F: Concurrent<F, Error>,
    private readonly ownerAuth: OwnerAuthApiService<F>,
    private readonly brandService: BrandApiService<F>,
    private readonly brandOwnerService: BrandOwnerApiService<F>,
  ) {}

  public get toHttpApp(): HttpApp<F> {
    return toHttpApp(this.F)(InventoryApi, {
      'application/json': {
        '@fp4ts/shopping-cart/application/inventory/brand/create-brand-dto':
          CreateBrandDto.jsonCodec,
        '@fp4ts/shopping-cart/domain/inventory/brand/brand':
          JsonCodec.fromSchema(Brand.schema),
      },
      '@fp4ts/http/dsl/from-htt-api-data': {
        // TODO: implement
        '@fp4ts/shipping-cart/domain/inventory/brand/brand-id': builtins[
          '@fp4ts/http/dsl/from-htt-api-data'
        ]['@fp4ts/core/string'] as any,
      },
      '@fp4ts/dsl-server/basic-auth-validator-tag': {
        'brand-management': this.ownerAuth.basicAuthenticator,
      },
    })(() => [
      owner => [
        [
          data => this.brandService.createBrand(owner, data),
          id => this.brandService.enableBrand(id),
          id => this.brandService.disableBrand(id),
        ],
      ],
      this.brandOwnerService.toHttpApp,
    ]);
  }
}
