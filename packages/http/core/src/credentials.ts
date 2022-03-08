// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, None, Option, Some } from '@fp4ts/cats';
import { AuthScheme } from './auth-scheme';

export type Credentials = Token | AuthParams;

export class Token {
  public readonly tag = 'token';

  public constructor(
    public readonly authScheme: AuthScheme,
    public readonly token: string,
  ) {}

  public toString(): string {
    return `${this.authScheme} ${this.token}`;
  }
}

export class AuthParams {
  public readonly tag = 'params';

  public constructor(
    public readonly authScheme: AuthScheme,
    public readonly params: List<[string, string]>,
  ) {}

  public toString(): string {
    return `${this.authScheme} ${this.params.toArray
      .map(([x, y]) => `${x}=${y}`)
      .join(',')}`;
  }
}

export class BasicCredentials {
  public constructor(
    public readonly username: string,
    public readonly password: string,
  ) {}

  public get token(): string {
    // TODO: Replace with isomorphic version
    return Buffer.from(`${this.username}:${this.password}`, 'utf8').toString(
      'base64',
    );
  }

  public static fromToken(token: string): BasicCredentials {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const [username, password = ''] = raw.split(':');
    return new BasicCredentials(username, password);
  }

  public static fromCredentials(creds: Credentials): Option<[string, string]> {
    if (creds.tag !== 'token') return None;
    if (creds.authScheme !== AuthScheme.Basic) return None;
    const bc = this.fromToken(creds.token);
    return Some([bc.username, bc.password]);
  }
}
