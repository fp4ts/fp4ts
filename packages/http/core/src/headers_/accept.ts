// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal, tupled } from '@fp4ts/core';
import {
  IdentityF,
  List,
  NonEmptyList,
  Map,
  Ord,
  Semigroup,
} from '@fp4ts/cats';
import { Parser, StringSource } from '@fp4ts/parse';

import { QValue } from '../q-value';
import {
  Header,
  SelectHeader,
  RawHeader,
  RecurringSelectHeaderMerge,
} from '../header';
import { MediaRange, MediaType, mediaTypeExtensionParser } from '../media-type';
import { ParseResult, Rfc7230 } from '../parsing';

export type Accept = AcceptHeader;
export const Accept: AcceptObj = function (mr, ...mrs) {
  return new AcceptHeader(
    MediaRangeAndQValue.from(mr),
    List.fromArray(mrs.map(MediaRangeAndQValue.from)),
  );
};

class AcceptHeader {
  public constructor(
    public readonly head: MediaRangeAndQValue,
    public readonly tail: List<MediaRangeAndQValue>,
  ) {}

  public toRaw(): NonEmptyList<RawHeader> {
    return Accept.Select.toRaw(this);
  }

  public accepts(mt: MediaType): boolean {
    return this.tail.cons(this.head).any(mr => mr.mediaRange.satisfiedBy(mt));
  }
}

Accept.Header = {
  headerName: 'Accept',
  value(a: AcceptHeader): string {
    const hd = `${a.head}`;
    return [hd, a.tail.toArray.map(xs => `${xs}`)].join(', ');
  },
  parse(s: string): ParseResult<AcceptHeader> {
    return ParseResult.fromParser(parser(), 'Invalid Accept Header')(s);
  },
};

Accept.Select = new RecurringSelectHeaderMerge(
  Accept.Header,
  Semigroup.of({
    combine_: (x, y) => {
      const yy = y();
      return new AcceptHeader(x.head, x.tail['+++'](yy.tail.cons(yy.head)));
    },
  }),
);

interface AcceptObj {
  (
    mt: MediaRange | MediaRangeAndQValue,
    ...mts: (MediaRange | MediaRangeAndQValue)[]
  ): AcceptHeader;
  Header: Header<Accept, 'recurring'>;
  Select: SelectHeader<IdentityF, Accept>;
}

export class MediaRangeAndQValue {
  public static from(
    mr: MediaRange | MediaRangeAndQValue,
  ): MediaRangeAndQValue {
    return mr instanceof MediaRangeAndQValue ? mr : new MediaRangeAndQValue(mr);
  }

  public constructor(
    public readonly mediaRange: MediaRange,
    public readonly qValue: QValue = QValue.one,
  ) {}

  public toString(): string {
    return `${this.mediaRange};${QValue.toString(this.qValue)}`;
  }
}

const parser: Lazy<Parser<StringSource, AcceptHeader>> = lazyVal(() => {
  const acceptParams = QValue.parser.product(mediaTypeExtensionParser.rep());

  const qAndExtension = acceptParams.orElse(() =>
    mediaTypeExtensionParser.rep1().map(ext => tupled(QValue.one, ext)),
  );

  const fullRange: Parser<StringSource, MediaRangeAndQValue> = MediaRange.parser
    .product(qAndExtension.optional())
    .map(([mr, params]) => {
      const [qvalue, exts] = params.getOrElse(() =>
        tupled(QValue.one, List.empty),
      );
      return new MediaRangeAndQValue(
        mr.withExtensions(Map.fromList<string>(Ord.primitive)(exts)),
        qvalue,
      );
    });

  return Rfc7230.headerRep1(fullRange).map(
    xs => new AcceptHeader(xs.head, xs.tail),
  );
});
