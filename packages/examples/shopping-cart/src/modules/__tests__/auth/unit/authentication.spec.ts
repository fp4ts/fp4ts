// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { IOF, IO } from '@fp4ts/effect';
import { UUID } from '../../../../common';
import {
  AuthenticationService,
  InvalidUsernameOrPassword,
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
        compare: (raw, hashed) => IO.pure(`${raw}_hashed` === hashed),
        genUUID: IO.pure(UUID.unsafeFromString('12345')),
      },
      memo,
    );
  });

  describe('registration', () => {
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

  describe('change of username', () => {
    it.M('should change the username', () =>
      IO.Monad.do(function* (_) {
        const credentials = {
          username: Username.unsafeFromString('user123'),
          password: Password.unsafeFromString('password'),
        };
        const newUsername = Username.unsafeFromString('new-username');
        const user = yield* _(service.registerUser(credentials));

        const res = yield* _(service.changeUsername(user.get, newUsername));

        expect(res.get).toEqual({ ...user.get, username: 'new-username' });
      }),
    );

    it.M("should not allow to change for username if it's already taken ", () =>
      IO.Monad.do(function* (_) {
        const credentials = {
          username: Username.unsafeFromString('user123'),
          password: Password.unsafeFromString('password'),
        };
        const newUsername = Username.unsafeFromString('new-username');
        const user = yield* _(service.registerUser(credentials));
        yield* _(
          service.registerUser({ ...credentials, username: newUsername }),
        );

        const res = yield* _(service.changeUsername(user.get, newUsername));

        expect(res.getLeft).toEqual(UsernameExistsError(newUsername));
      }),
    );
  });

  describe('change password', () => {
    it.M('should allow to login with new password after a change', () =>
      IO.Monad.do(function* (_) {
        const credentials = {
          username: Username.unsafeFromString('user123'),
          password: Password.unsafeFromString('password'),
        };
        const user = yield* _(service.registerUser(credentials));
        const newPassword = Password.unsafeFromString('password2');

        yield* _(service.changePassword(user.get, newPassword));
        const res = yield* _(
          service.loginUser({ ...credentials, password: newPassword }),
        );

        expect(res.get).toEqual({ ...user.get, password: 'password2_hashed' });
      }),
    );

    it.M('should return error on using old password after a change', () =>
      IO.Monad.do(function* (_) {
        const credentials = {
          username: Username.unsafeFromString('user123'),
          password: Password.unsafeFromString('password'),
        };
        const user = yield* _(service.registerUser(credentials));
        const newPassword = Password.unsafeFromString('password2');

        yield* _(service.changePassword(user.get, newPassword));
        const res = yield* _(service.loginUser({ ...credentials }));

        expect(res.getLeft).toEqual(InvalidUsernameOrPassword());
      }),
    );
  });
});
