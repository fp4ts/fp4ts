// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF } from '@fp4ts/effect';
import { BcryptHash, GenUUID } from '../../common';
import { ApiService } from '../application';

import { IOAuthModule } from './auth';
import { IOVersionModule } from './version';

export class IOAppModule {
  public static make(): IO<IOAppModule> {
    return IO.Monad.do(function* (_) {
      const bcrypt = BcryptHash.async(IO.Async);
      const genUUID = GenUUID.v4(IO.Sync);

      const version = yield* _(IOVersionModule.make());
      const auth = yield* _(IOAuthModule.make({ ...bcrypt, ...genUUID }));

      const apiService = new ApiService(
        IO.Concurrent,
        version.apiService,
        auth.apiService,
      );
      return new IOAppModule(apiService);
    });
  }

  private constructor(public readonly apiService: ApiService<IOF>) {}
}
