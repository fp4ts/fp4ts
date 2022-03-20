// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { IOF, IO } from '@fp4ts/effect';
import { UUID } from '../../../../common';
import {
  AuthenticationService,
  Password,
  Username,
  UsernameExistsError,
} from '../../../domain/auth';
import { InMemoryUserRepository } from '../user-repository';

describe('Authentication', () => {
  let service: AuthenticationService<IOF>;

  beforeEach(() => {
    const memo = new InMemoryUserRepository(IO.Sync);
    service = new AuthenticationService(
      {
        ...IO.Monad,
        hash: pwd => IO.pure(`${pwd}_hashed`),
        compare: (lhs, rhs) => IO.pure(lhs === `${rhs}_hashed`),
        genUUID: IO.pure(UUID.unsafeFromString('12345')),
      },
      memo,
    );
  });

  it.M('should be able to login after registration', () =>
    IO.Monad.do(function* (_) {
      const registeredUser = yield* _(
        service.registerUser({
          username: Username.unsafeFromString('user123'),
          password: Password.unsafeFromString('password'),
        }),
      );

      const loggedInUser = yield* _(
        service.loginUser({
          username: Username.unsafeFromString('user123'),
          password: Password.unsafeFromString('password'),
        }),
      );

      expect(loggedInUser.get).toEqual(registeredUser.get);
    }),
  );

  it.M('should error on username collision', () =>
    IO.Monad.do(function* (_) {
      const credentials = {
        username: Username.unsafeFromString('user123'),
        password: Password.unsafeFromString('password'),
      };

      yield* _(service.registerUser(credentials));
      const res = yield* _(service.registerUser(credentials));

      expect(res.getLeft).toEqual(UsernameExistsError(credentials.username));
    }),
  );
});
