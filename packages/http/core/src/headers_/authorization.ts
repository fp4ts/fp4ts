// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IdentityF, NonEmptyList } from '@fp4ts/cats';
import { lazyVal } from '@fp4ts/core';
import { Credentials } from '../credentials';
import { Header, RawHeader, SelectHeader, SingleSelectHeader } from '../header';
import { ParseResult, Rfc7235 } from '../parsing';

export class Authorization {
  public constructor(public readonly credentials: Credentials) {}

  public toRaw(): NonEmptyList<RawHeader> {
    return Authorization.Select.toRaw(this);
  }

  public toString(): string {
    const H = Authorization.Header;
    return `${H.headerName}: ${H.value(this)}`;
  }

  public static readonly Header: Header<Authorization, 'single'> = {
    headerName: 'Authorization',
    value(a: Authorization): string {
      return `${a.credentials.toString()}`;
    },
    parse(s: string): ParseResult<Authorization> {
      return ParseResult.fromParser(
        parser(),
        'Invalid Authorization header',
      )(s);
    },
  };

  public static readonly Select: SelectHeader<IdentityF, Authorization> =
    new SingleSelectHeader(Authorization.Header);
}

const parser = lazyVal(() =>
  Rfc7235.credentials.map(creds => new Authorization(creds)),
);
