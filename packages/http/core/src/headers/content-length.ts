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
export const ContentLength: ContentLengthObj = function (n) {
  return new ContentLengthHeader(n);
};

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

ContentLength.zero = ContentLength(0);
ContentLength.fromNumber = n => (n >= 0 ? Some(ContentLength(n)) : None);

ContentLength.Header = {
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

ContentLength.Select = new SingleSelectHeader(ContentLength.Header);
