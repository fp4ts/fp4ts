// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Map, Right } from '@fp4ts/cats';
import { tupled } from '@fp4ts/core';

export class MediaRange {
  public constructor(
    public readonly mainType: string,
    public readonly extensions: Map<string, string> = Map.empty,
  ) {}

  public satisfiedBy(that: MediaRange): boolean {
    return this.mainType === '*' || this.mainType === that.mainType;
  }

  public satisfies(that: MediaRange): boolean {
    return that.satisfiedBy(this);
  }

  public static readonly any_any = new MediaRange('*');
  public static readonly application_any = new MediaRange('application');
  public static readonly text_any = new MediaRange('text');

  public static readonly standard: Map<string, MediaRange> = Map(
    ...[this.any_any, this.application_any, this.text_any].map(x =>
      tupled(x.mainType, x),
    ),
  );

  public static fromString(s: string): Either<Error, MediaRange> {
    const [x, y] = s.split('/');
    if (x && y === '*') {
      return Right(new MediaRange(x));
    } else {
      return Right(new MediaType(x, y));
    }
  }

  public toString(): string {
    return `${this.mainType}/*`;
  }
}

export class MediaType extends MediaRange {
  public constructor(
    mainType: string,
    public readonly subType: string,
    extensions: Map<string, string> = Map.empty,
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

  public static readonly application_json = new MediaType(
    'application',
    'json',
  );
  public static readonly text_plain = new MediaType('text', 'plain');

  public static override fromString(s: string): Either<Error, MediaType> {
    const [x, y] = s.split('/');
    if (x && y) {
      return Right(new MediaType(x, y));
    } else {
      return Left(new Error('Invalid media type'));
    }
  }

  public override toString(): string {
    return `${this.mainType}/${this.subType}`;
  }
}
