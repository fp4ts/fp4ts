// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, IdentityK, List } from '@fp4ts/cats';
import { Header, SelectHeader, RawHeader, SingleSelectHeader } from '../header';
import { MediaType } from '../media-type';

export type ContentType = ContentTypeHeader;
export const ContentType: ContentTypeObj = function (mt) {
  return new ContentTypeHeader(mt);
};

class ContentTypeHeader {
  public constructor(public readonly mediaType: MediaType) {}

  public toRaw(): List<RawHeader> {
    return ContentType.Select.toRaw(this);
  }
}

ContentType.Header = {
  headerName: 'Content-Type',
  value(a: ContentTypeHeader): string {
    return `${a.mediaType.mainType}/${a.mediaType.subType}`;
  },
  parse(s: string): Either<Error, ContentTypeHeader> {
    const [x = ''] = s.split(';');
    return MediaType.fromString(x).map(mt => new ContentTypeHeader(mt));
  },
};

ContentType.Select = new SingleSelectHeader(ContentType.Header);

interface ContentTypeObj {
  (mt: MediaType): ContentTypeHeader;
  Header: Header<ContentType, 'single'>;
  Select: SelectHeader<IdentityK, ContentType>;
}
