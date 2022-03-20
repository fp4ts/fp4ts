// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Concurrent } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http';
import { toHttpApp } from '@fp4ts/http-dsl-server';
import { JsonCodec } from '@fp4ts/schema-json';

import { BrandOwner } from '../../../domain/inventory/brand-owner';
import { LoginApiService } from '../../auth';

import { BrandOwnerApi } from './brand-owner-api';
import { CreateBrandOwnerApiService } from './create-brand-owner-api-service';

export class BrandOwnerApiService<F> {
  public constructor(
    private readonly F: Concurrent<F, Error>,
    private readonly loginApiService: LoginApiService<F>,
    private readonly createOwner: CreateBrandOwnerApiService<F>,
  ) {}

  public get toHttpApp(): HttpApp<F> {
    return toHttpApp(this.F)(BrandOwnerApi, {
      'application/json': {
        '@fp4ts/shopping-cart/domain/inventory/brand-owner/brand-owner':
          JsonCodec.fromSchema(BrandOwner.schema),
      },
      '@fp4ts/dsl-server/basic-auth-validator-tag': {
        auth: this.loginApiService.basicAuthenticator,
      },
    })(() => [user => this.createOwner.createBrandOwner(user)]);
  }
}
