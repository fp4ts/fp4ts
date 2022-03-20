// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Option } from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect';
import { User } from '../../domain/auth/user';
import { Username } from '../../domain/auth/values';

export class InMemoryUserRepository<F> {
  public constructor(
    private readonly F: Sync<F>,
    private readonly store: Record<string, User> = {},
  ) {}

  public findByUsername(username: Username): Kind<F, [Option<User>]> {
    return this.F.pure(Option(this.store[Username.toString(username)]));
  }

  public save(user: User): Kind<F, [User]> {
    const { F } = this;
    return F.delay(() => {
      this.store[Username.toString(user.username)] = user;
      return user;
    });
  }
}