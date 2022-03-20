// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Option } from '@fp4ts/cats';
import { User } from '../user';
import { Username } from '../values';

export interface UserRepository<F> {
  findByUsername(username: Username): Kind<F, [Option<User>]>;
  save(user: User): Kind<F, [User]>;
}
