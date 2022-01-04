// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Either,
  IdentityK,
  Left,
  List,
  None,
  Option,
  Right,
  Some,
} from '@fp4ts/cats';
import { Header, RawHeader, SelectHeader, SingleSelectHeader } from '../header';

export type ContentLength = ContentLengthHeader;
export const ContentLength: ContentLengthObj = function (n: number) {
  return new ContentLengthHeader(n);
} as any;

class ContentLengthHeader {
  public constructor(public readonly length: number) {}

  public toRaw(): List<RawHeader> {
    return ContentLength.Select.toRaw(this);
  }
}

interface ContentLengthObj {
  (n: number): ContentLength;
  zero: ContentLength;
  fromNumber(n: number): Option<ContentLength>;

  Header: Header<ContentLength, 'single'>;
  Select: SelectHeader<IdentityK, ContentLength>;
}

Object.defineProperty(ContentLength, 'zero', {
  get() {
    return ContentLength(0);
  },
});
Object.defineProperty(ContentLength, 'fromNumber', {
  get() {
    return (n: number) => (n >= 0 ? Some(ContentLength(n)) : None);
  },
});

Object.defineProperty(ContentLength, 'Header', {
  get() {
    return {
      headerName: 'Content-Length',
      value(a: ContentLengthHeader): string {
        return `${a.length}`;
      },
      parse(s: string): Either<Error, ContentLengthHeader> {
        const x = parseInt(s, 10);
        return !Number.isNaN(x) && x >= 0
          ? Right(new ContentLengthHeader(x))
          : Left(new Error(`Invalid content length '${x}'`));
      },
    };
  },
});

Object.defineProperty(ContentLength, 'Select', {
  get() {
    return new SingleSelectHeader(ContentLength.Header);
  },
});
