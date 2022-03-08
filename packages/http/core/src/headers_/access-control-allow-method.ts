// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IdentityF, NonEmptyList } from '@fp4ts/cats';
import { Header, RawHeader, SelectHeader, SingleSelectHeader } from '../header';
import { Method } from '../messages';

export class AccessControlAllowMethod {
  public constructor(public readonly method: Method) {}

  public toRaw(): NonEmptyList<RawHeader> {
    return AccessControlAllowMethod.Select.toRaw(this);
  }

  public toString(): string {
    const H = AccessControlAllowMethod.Header;
    return `${H.headerName}: ${H.value(this)}`;
  }

  public static readonly Header: Header<AccessControlAllowMethod, 'single'> = {
    headerName: 'Access-Control-Request-Method',
    value: h => h.method.methodName,
    parse: s => Method.fromString(s).map(m => new AccessControlAllowMethod(m)),
  };

  public static readonly Select: SelectHeader<
    IdentityF,
    AccessControlAllowMethod
  > = new SingleSelectHeader(AccessControlAllowMethod.Header);
}
