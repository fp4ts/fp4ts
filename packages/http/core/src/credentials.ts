// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '@fp4ts/cats';
import { AuthScheme } from './auth-scheme';

export type Credentials = Token | AuthParams;

export class Token {
  public readonly tag = 'token';

  public constructor(
    public readonly authScheme: AuthScheme,
    public readonly token: string,
  ) {}
}

export class AuthParams {
  public readonly tag = 'params';

  public constructor(
    public readonly authScheme: AuthScheme,
    public readonly params: List<[string, string]>,
  ) {}
}
