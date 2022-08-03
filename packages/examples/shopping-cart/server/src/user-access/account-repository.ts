// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Map, Option } from '@fp4ts/cats';
import { Concurrent, Ref } from '@fp4ts/effect';
import { Email } from '@shopping-cart/common';
import { Account } from '@shopping-cart/common/lib/user-access';

export interface AccountRepository<F> {
  findByEmail(email: Email): Kind<F, [Option<Account>]>;
  save(account: Account): Kind<F, [Account]>;
}

export class InMemoryAccountRepository<F> implements AccountRepository<F> {
  public static make<F>(
    F: Concurrent<F, Error>,
  ): Kind<F, [InMemoryAccountRepository<F>]> {
    return F.map_(
      F.ref<Map<Email, Account>>(Map.empty),
      store => new InMemoryAccountRepository(F, store),
    );
  }

  private constructor(
    private readonly F: Concurrent<F, Error>,
    private readonly ref: Ref<F, Map<Email, Account>>,
  ) {}

  findByEmail(email: Email): Kind<F, [Option<Account>]> {
    return this.F.map_(this.ref.get(), store => store['!?'](Email.Ord, email));
  }

  save(account: Account): Kind<F, [Account]> {
    return this.ref.modify(store => {
      const updated = store['!?'](Email.Ord, account.email).getOrElse(
        () => account,
      );
      return [store.insert(Email.Ord, updated.email, updated), updated];
    });
  }
}
