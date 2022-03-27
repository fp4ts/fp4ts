// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO } from '@fp4ts/effect';
import { JsonCodec } from '@fp4ts/schema-json';
import { NodeClient } from '@fp4ts/http-node-client';
import { builtins, ClientM, toClientIn } from '@fp4ts/http-dsl-client';

import { Api } from '../application';
import {
  AuthApi,
  ChangePasswordDto,
  ChangeUsernameDto,
  RegisterUserDto,
  UserDto,
} from '../application/auth';
import { InventoryApi } from '../application/inventory';
import { BrandApi, CreateBrandDto } from '../application/inventory/brand';
import { Brand } from '../domain/inventory/brand';
import { BrandOwnerApi } from '../application/inventory/brand-owner';
import { BrandOwner } from '../domain/inventory/brand-owner';

const client = NodeClient.makeClient(IO.Async);
const RC = ClientM.RunClientIO(client);

export const [version, auth, inventory] = toClientIn(RC)(Api, {});

export const [registerUser, loginUser] = toClientIn(RC)(AuthApi, {
  'application/json': {
    '@fp4ts/shopping-cart/application/auth/change-password-dto':
      ChangePasswordDto.jsonCodec,
    '@fp4ts/shopping-cart/application/auth/change-username-dto':
      ChangeUsernameDto.jsonCodec,
    '@fp4ts/shopping-cart/application/auth/register-user-dto':
      RegisterUserDto.jsonCodec,
    '@fp4ts/shopping-cart/application/auth/user-dto': UserDto.jsonCodec,
  },
});

export const [loginBrand, brandOwner] = toClientIn(RC)(InventoryApi, {
  'application/json': {
    '@fp4ts/shopping-cart/application/inventory/brand/create-brand-dto':
      CreateBrandDto.jsonCodec,
    '@fp4ts/shopping-cart/domain/inventory/brand/brand': JsonCodec.fromSchema(
      Brand.schema,
    ),
  },
  '@fp4ts/http/dsl/to-htt-api-data': {
    '@fp4ts/shipping-cart/domain/inventory/brand/brand-id': builtins[
      '@fp4ts/http/dsl/from-htt-api-data'
    ]['@fp4ts/core/string'] as any,
  },
});

export const [registerBrandOwner] = toClientIn(RC)(BrandOwnerApi, {
  'application/json': {
    '@fp4ts/shopping-cart/domain/inventory/brand-owner/brand-owner':
      JsonCodec.fromSchema(BrandOwner.schema),
  },
});

export const [registerBrand, enableBrand, disableBand] = toClientIn(RC)(
  BrandApi,
  {
    '@fp4ts/http/dsl/to-htt-api-data': {
      '@fp4ts/shipping-cart/domain/inventory/brand/brand-id': builtins[
        '@fp4ts/http/dsl/from-htt-api-data'
      ]['@fp4ts/core/string'] as any,
    },

    'application/json': {
      '@fp4ts/shopping-cart/application/inventory/brand/create-brand-dto':
        CreateBrandDto.jsonCodec,
      '@fp4ts/shopping-cart/domain/inventory/brand/brand': JsonCodec.fromSchema(
        Brand.schema,
      ),
    },
  },
);
