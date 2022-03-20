// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF } from '@fp4ts/effect';
import { BcryptHash, GenUUID } from '../../../common';
import {
  AuthApiService,
  ChangeCredentialsApiService,
  LoginApiService,
  RegistrationApiService,
} from '../../application/auth';

import { AuthenticationService } from '../../domain/auth';

import { IORefUserRepository } from './io-ref-user-repository';

export class IOAuthModule {
  public static make(D: BcryptHash<IOF> & GenUUID<IOF>): IO<IOAuthModule> {
    return IO.Monad.do(function* (_) {
      const F = IO.Concurrent;
      const repo = yield* _(IORefUserRepository.make());

      const service = new AuthenticationService({ ...F, ...D }, repo);
      const regApiService = new RegistrationApiService(F, service);
      const editService = new ChangeCredentialsApiService(F, service);
      const loginService = new LoginApiService(F, service);

      return new IOAuthModule(
        new AuthApiService(F, regApiService, editService, loginService),
      );
    });
  }

  private constructor(public readonly apiService: AuthApiService<IOF>) {}
}
