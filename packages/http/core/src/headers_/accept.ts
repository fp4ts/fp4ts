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

export class Accept {
  public readonly values: NonEmptyList<MediaRangeAndQValue>;

  public constructor(head: MediaRange, ...tail: MediaRange[]);
  public constructor(
    head: MediaRangeAndQValue,
    tail: List<MediaRangeAndQValue>,
  );
  public constructor(values: NonEmptyList<MediaRangeAndQValue>);
  public constructor(head: any, ...tail: any[]) {
    if (head instanceof MediaRange) {
      this.values = NonEmptyList(
        new MediaRangeAndQValue(head),
        List.fromArray(tail.map(x => new MediaRangeAndQValue(x))),
      );
    } else if (tail[0]) {
      this.values = NonEmptyList(head, tail[0]);
    } else {
      this.values = head;
    }
  }

  public toRaw(): NonEmptyList<RawHeader> {
    return Accept.Select.toRaw(this);
  }

  public accepts(mt: MediaType): boolean {
    return this.values.any(mr => mr.mediaRange.satisfiedBy(mt));
  }

  public toString(): string {
    return `${Accept.Header.headerName}: ${Accept.Header.value(this)}`;
  }

  public static readonly Header: Header<Accept, 'recurring'> = {
    headerName: 'Accept',
    value(a: Accept): string {
      return [a.values.toArray.map(xs => `${xs}`)].join(', ');
    },
    parse(s: string): ParseResult<Accept> {
      return ParseResult.fromParser(parser(), 'Invalid Accept Header')(s);
    },
  };
  public static readonly Select: SelectHeader<IdentityF, Accept> =
    new RecurringSelectHeaderMerge(
      Accept.Header,
      Semigroup.of({
        combine_: (x, y) => new Accept(x.values.concatNel(y().values)),
      }),
    );
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
    return `${this.mediaRange}${QValue.toString(this.qValue)}`;
  }
}

const parser: Lazy<Parser<StringSource, Accept>> = lazyVal(() => {
  const acceptParams = QValue.parser.product(mediaTypeExtensionParser().rep());

  const qAndExtension = acceptParams.orElse(() =>
    mediaTypeExtensionParser()
      .rep1()
      .map(ext => tupled(QValue.one, ext)),
  );

  const fullRange: Parser<StringSource, MediaRangeAndQValue> = MediaRange.parser
    .product(qAndExtension.optional())
    .map(([mr, params]) => {
      const [qvalue, exts] = params.getOrElse(() =>
        tupled(QValue.one, List.empty),
      );
      return new MediaRangeAndQValue(
        mr.withExtensions(
          Map.fromList<string>(Ord.fromUniversalCompare())(exts),
        ),
        qvalue,
      );
    });

  return Rfc7230.headerRep1(fullRange).map(xs => new Accept(xs.head, xs.tail));
});
