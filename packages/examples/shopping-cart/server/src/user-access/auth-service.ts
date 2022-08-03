// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Monad, None, Option, Some } from '@fp4ts/cats';
import { Email } from '@shopping-cart/common';
import { Account, Password, Role } from '@shopping-cart/common/lib/user-access';
import { AccountRepository } from './account-repository';
import { Hashing } from './hashing';

export class AuthService<F> {
  constructor(
    private readonly F: Monad<F>,
    private readonly h: Hashing<F>,
    private readonly ar: AccountRepository<F>,
  ) {}

  login(email: Email, password: Password): Kind<F, [Option<Account>]> {
    const { F, h, ar } = this;

    return pipe(
      ar.findByEmail(email),
      F.flatMap(account =>
        account.fold<Kind<F, [Option<Account>]>>(
          () => F.pure(None),
          account =>
            pipe(
              h.compare(password, account.hashedPassword),
              F.map(matches => (matches ? Some(account) : None)),
            ),
        ),
      ),
    );
  }

  register(
    email: Email,
    password: Password,
    roles: Role[],
  ): Kind<F, [Option<Account>]> {
    const { F, h, ar } = this;
    return pipe(
      ar.findByEmail(email),
      F.flatMap(account =>
        account.fold<Kind<F, [Option<Account>]>>(
          () =>
            pipe(
              h.hash(password),
              F.map(hashedPassword => ({ email, hashedPassword, roles })),
              F.flatMap(account => ar.save(account)),
              F.map(Some),
            ),
          () => F.pure(None), // account already exists
        ),
      ),
    );
  }
}
