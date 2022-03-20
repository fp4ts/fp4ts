// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { BasicAuth } from '@fp4ts/http-dsl';
import { User } from '../../domain/auth';

export const UserBasicAuth = BasicAuth('auth', User.Ref);
