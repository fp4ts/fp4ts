import { IO, IOF } from '@fp4ts/effect';
import { BcryptHash, GenUUID } from '../../../common';
import { AuthApiService, RegistrationApiService } from '../../application/auth';

import { AuthenticationService } from '../../domain/auth';

import { IORefUserRepository } from './io-ref-user-repository';

export class IOAuthModule {
  public static make(D: BcryptHash<IOF> & GenUUID<IOF>): IO<IOAuthModule> {
    return IO.Monad.do(function* (_) {
      const repo = yield* _(IORefUserRepository.make());

      const regService = new AuthenticationService({ ...IO.Monad, ...D }, repo);
      const regApiService = new RegistrationApiService(
        IO.Concurrent,
        regService,
      );
      const apiService = new AuthApiService(IO.Concurrent, regApiService);

      return new IOAuthModule(apiService);
    });
  }

  private constructor(public readonly apiService: AuthApiService<IOF>) {}
}
