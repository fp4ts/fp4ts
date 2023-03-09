// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char, Lazy, lazy, tupled } from '@fp4ts/core';
import { Ord } from '@fp4ts/cats';
import { OrdMap } from '@fp4ts/collections';
import { Parser, StringSource, text } from '@fp4ts/parse';

import { ParseResult, Rfc7230 } from './parsing';

const OrdString2: Ord<[string, string]> = Ord.tuple(
  Ord.fromUniversalCompare(),
  Ord.fromUniversalCompare(),
);

export class MediaRange {
  public constructor(
    public readonly mainType: string,
    public readonly extensions: OrdMap<string, string> = OrdMap.empty,
  ) {}

  public satisfiedBy(that: MediaRange): boolean {
    return this.mainType === '*' || this.mainType === that.mainType;
  }

  public satisfies(that: MediaRange): boolean {
    return that.satisfiedBy(this);
  }

  public withExtensions(exts: OrdMap<string, string>): MediaRange {
    return new MediaRange(this.mainType, exts);
  }

  public static readonly '*/*' = new MediaRange('*');
  public static readonly 'application/*' = new MediaRange('application');
  public static readonly 'text/*' = new MediaRange('text');

  public static readonly standard: OrdMap<string, MediaRange> =
    OrdMap.fromArray(
      [this['*/*'], this['application/*'], this['text/*']].map(x =>
        tupled(x.mainType, x),
      ),
    );

  public static fromString(s: string): ParseResult<MediaRange> {
    return ParseResult.fromParser(this.parser, 'media range')(s);
  }

  public toString(): string {
    return `${this.mainType}/*`;
  }

  public static get parser(): Parser<StringSource, MediaRange> {
    return mediaRangeParser(getMediaRange);
  }

  public static get fullParser(): Parser<StringSource, MediaRange> {
    const extensions = mediaTypeExtensionParser().rep();

    return this.parser
      .product(extensions)
      .map(([mr, xs]) =>
        xs.isEmpty ? mr : mr.withExtensions(OrdMap.fromList(xs)),
      );
  }
}

export class MediaType extends MediaRange {
  public constructor(
    mainType: string,
    public readonly subType: string,
    extensions: OrdMap<string, string> = OrdMap.empty,
  ) {
    super(mainType, extensions);
  }

  public override satisfiedBy(that: MediaRange): boolean {
    if (that instanceof MediaType) {
      return (
        this === that ||
        (this.mainType === that.mainType && this.subType === that.subType)
      );
    } else {
      return false;
    }
  }

  public override withExtensions(exts: OrdMap<string, string>): MediaType {
    return new MediaType(this.mainType, this.subType, exts);
  }

  public static readonly 'application/json' = new MediaType(
    'application',
    'json',
  );
  public static readonly 'text/plain' = new MediaType('text', 'plain');

  public static readonly all: OrdMap<[string, string], MediaType> =
    OrdMap.fromArray<[string, string], MediaType>(
      [
        [['application', 'json'], this['application/json']],
        [['text', 'plain'], this['text/plain']],
      ],
      OrdString2,
    );

  public static override fromString(s: string): ParseResult<MediaType> {
    return ParseResult.fromParser(this.parser, 'media type')(s);
  }

  public override toString(): string {
    return `${this.mainType}/${this.subType}`;
  }

  public static override get parser(): Parser<StringSource, MediaType> {
    const mt = mediaRangeParser(getMediaType);
    const extensions = mediaTypeExtensionParser().rep();

    return mt
      .product(extensions)
      .map(([mt, xs]) =>
        xs.isEmpty ? mt : mt.withExtensions(OrdMap.fromList(xs)),
      );
  }
}

// -- Private implementation

const getMediaRange = (mainType: string, subType: string): MediaRange => {
  return subType === '*'
    ? MediaRange.standard
        .lookup(mainType.toLowerCase())
        .getOrElse(() => new MediaRange(mainType.toLowerCase()))
    : MediaType.all
        .lookup(tupled(mainType, subType), OrdString2)
        .getOrElse(
          () => new MediaType(mainType.toLowerCase(), subType.toLowerCase()),
        );
};

const getMediaType = (mainType: string, subType: string): MediaType => {
  return MediaType.all
    .lookup(tupled(mainType, subType), OrdString2)
    .getOrElse(
      () => new MediaType(mainType.toLowerCase(), subType.toLowerCase()),
    );
};

const mediaRangeParser = <A>(
  builder: (l: string, r: string) => A,
): Parser<StringSource, A> => {
  const anyStr1 = text.char('*' as Char);

  return text
    .string('*/*')
    .as(['*', '*'] as [string, string])
    .backtrack()
    .orElse(
      Rfc7230.token['<*'](text.char('/' as Char)).product(
        anyStr1.as('*').orElse(Rfc7230.token),
      ),
    )
    .orElse(anyStr1.as(['*', '*']))
    .map(([s1, s2]) => builder(s1, s2));
};

export const mediaTypeExtensionParser: Lazy<
  Parser<StringSource, [string, string]>
> = lazy(() =>
  text
    .char(';' as Char)
    ['*>'](Rfc7230.ows)
    ['*>'](Rfc7230.token)
    .product(
      text
        .char('=' as Char)
        ['*>'](Rfc7230.token.orElse(Rfc7230.quotedString))
        .optional(),
    )
    .map(([str, ostr]) => [
      str,
      ostr.getOrElse(() => '').replace(/\\\\/gm, '\\'),
    ]),
);
