// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Concurrent } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http';
import { toHttpApp, builtins } from '@fp4ts/http-dsl-server';

import { AuthApi } from './auth-api';
import { ChangeCredentialsApiService } from './change-credentials-api-service';
import {
  ChangePasswordDto,
  ChangeUsernameDto,
  RegisterUserDto,
  UserDto,
} from './dto';
import { LoginApiService } from './login-api-service';
import { RegistrationApiService } from './registration-api-service';

export class AuthApiService<F> {
  public constructor(
    private readonly F: Concurrent<F, Error>,
    private readonly registration: RegistrationApiService<F>,
    private readonly edit: ChangeCredentialsApiService<F>,
    private readonly login: LoginApiService<F>,
  ) {}

  public get toHttpApp(): HttpApp<F> {
    return toHttpApp(this.F)(AuthApi, {
      ...builtins,
      'application/json': {
        '@fp4ts/shopping-cart/application/auth/register-user-dto':
          RegisterUserDto.jsonCodec,
        '@fp4ts/shopping-cart/application/auth/user-dto': UserDto.jsonCodec,
        '@fp4ts/shopping-cart/application/auth/change-password-dto':
          ChangePasswordDto.jsonCodec,
        '@fp4ts/shopping-cart/application/auth/change-username-dto':
          ChangeUsernameDto.jsonCodec,
      },
      '@fp4ts/dsl-server/basic-auth-validator-tag': {
        auth: this.login.basicAuthenticator,
      },
    })(() => [
      credentials => this.registration.registerUser(credentials),
      user => [
        payload => this.edit.changeUsername(user, payload),
        payload => this.edit.changePassword(user, payload),
      ],
    ]);
  }
}
