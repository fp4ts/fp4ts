// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';
import { IO, IOF, Ref } from '@fp4ts/effect';
import { User, UserId, Username, UserRepository } from '../../domain/auth';

export class IORefUserRepository implements UserRepository<IOF> {
  public static make = (): IO<IORefUserRepository> =>
    IO.ref({} as Record<string, User>).map(
      store => new IORefUserRepository(store),
    );

  private constructor(private readonly store: Ref<IOF, Record<string, User>>) {}

  public findByUsername(username: Username): IO<Option<User>> {
    return this.store
      .get()
      .map(users =>
        Option(Object.values(users).find(user => user.username === username)),
      );
  }

  public save(user: User): IO<User> {
    const plainId = UserId.toString(user.id);
    return this.store
      .update(users => ({ ...users, [plainId]: user }))
      .map(() => user);
  }
}
