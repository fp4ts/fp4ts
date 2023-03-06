// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Either,
  Left,
  None,
  Option,
  Right,
  Some,
  IdentityF,
} from '@fp4ts/cats';
import { NonEmptyList } from '@fp4ts/collections';
import { Header, RawHeader, SelectHeader, SingleSelectHeader } from '../header';

export class ContentLength {
  public constructor(public readonly length: number) {}

  public toRaw(): NonEmptyList<RawHeader> {
    return ContentLength.Select.toRaw(this);
  }

  public toString(): string {
    const H = ContentLength.Header;
    return `${H.headerName}: ${H.value(this)}`;
  }

  public static readonly zero = new ContentLength(0);
  public static fromNumber(n: number): Option<ContentLength> {
    return n >= 0 ? Some(new ContentLength(n)) : None;
  }

  public static readonly Header: Header<ContentLength, 'single'> = {
    headerName: 'Content-Length',
    value(a: ContentLength): string {
      return `${a.length}`;
    },
    parse(s: string): Either<Error, ContentLength> {
      const x = parseInt(s, 10);
      return !Number.isNaN(x) && x >= 0
        ? Right(new ContentLength(x))
        : Left(new Error(`Invalid content length '${x}'`));
    },
  };

  public static readonly Select: SelectHeader<IdentityF, ContentLength> =
    new SingleSelectHeader(ContentLength.Header);
}
