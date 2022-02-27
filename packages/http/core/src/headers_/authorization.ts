// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IdentityF, List } from '@fp4ts/cats';
import { Credentials } from '../credentials';
import { Header, RawHeader, SelectHeader, SingleSelectHeader } from '../header';
import { ParseResult, Rfc7235 } from '../parsing';

export type Authorization = AuthorizationHeader;
export const Authorization: AuthorizationObj = function (creds) {
  return new AuthorizationHeader(creds);
};

class AuthorizationHeader {
  public constructor(public readonly credentials: Credentials) {}

  public toRaw(): List<RawHeader> {
    return Authorization.Select.toRaw(this);
  }
}

Authorization.Header = {
  headerName: 'Authorization',
  value(a: AuthorizationHeader): string {
    return `${a.credentials}`;
  },
  parse(s: string): ParseResult<AuthorizationHeader> {
    return ParseResult.fromParser(parser, 'Invalid Authorization header')(s);
  },
};

Authorization.Select = new SingleSelectHeader(Authorization.Header);

interface AuthorizationObj {
  (creds: Credentials): AuthorizationHeader;
  Header: Header<Authorization, 'single'>;
  Select: SelectHeader<IdentityF, Authorization>;
}

const parser = Rfc7235.credentials.map(Authorization);
