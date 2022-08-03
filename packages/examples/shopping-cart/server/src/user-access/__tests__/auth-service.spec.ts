// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { None, Some } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { Email, Password } from '@shopping-cart/common';
import { InMemoryAccountRepository } from '../account-repository';
import { AuthService } from '../auth-service';
import { Hashing } from '../hashing';

describe('Auth Service', () => {
  const withService = (f: (as: AuthService<IOF>) => IO<void>): IO<void> =>
    InMemoryAccountRepository.make(IO.Concurrent)
      .map(ar => new AuthService(IO.Monad, Hashing.Identity(IO.Monad), ar))
      .flatMap(f);

  it.M('should login the user after registration', () =>
    withService(service =>
      IO.Monad.do(function* (_) {
        const email = Email.unsafeFromString('test@test.com');
        const password = Password.unsafeFromString('12345678');

        yield* _(service.register(email, password, []));
        const account = yield* _(service.login(email, password));

        expect(account).toEqual(
          Some({ email, hashedPassword: password, roles: [] }),
        );
      }),
    ),
  );

  it.M('should not login the user when it is not registered', () =>
    withService(service =>
      IO.Monad.do(function* (_) {
        const email = Email.unsafeFromString('test@test.com');
        const password = Password.unsafeFromString('12345678');

        const account = yield* _(service.login(email, password));

        expect(account).toEqual(None);
      }),
    ),
  );

  it.M('should not register a user with the same email twice', () =>
    withService(service =>
      IO.Monad.do(function* (_) {
        const email = Email.unsafeFromString('test@test.com');
        const password = Password.unsafeFromString('12345678');

        yield* _(service.register(email, password, []));
        const account = yield* _(service.register(email, password, []));

        expect(account).toEqual(None);
      }),
    ),
  );
});
