// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, IdentityF, Semigroup } from '@fp4ts/cats';
import { List, NonEmptyList } from '@fp4ts/collections';
import {
  Header,
  SelectHeader,
  RawHeader,
  RecurringSelectHeaderMerge,
} from '../header';
import { Challenge } from '../challenge';
import { ParseResult, Rfc7235 } from '../parsing';

export class WWWAuthenticate {
  public readonly values: NonEmptyList<Challenge>;

  public constructor(head: Challenge, ...tail: Challenge[]);
  public constructor(values: NonEmptyList<Challenge>);
  public constructor(head: any, ...tail: any[]) {
    if (head instanceof Challenge) {
      this.values = NonEmptyList(head, List.fromArray(tail));
    } else {
      this.values = head;
    }
  }

  public toRaw(): NonEmptyList<RawHeader> {
    return WWWAuthenticate.Select.toRaw(this);
  }

  public static Header: Header<WWWAuthenticate, 'recurring'> = {
    headerName: 'WWW-Authenticate',
    value(a: WWWAuthenticate): string {
      return a.values.toArray.join(', ');
    },
    parse(s: string): Either<Error, WWWAuthenticate> {
      return ParseResult.fromParser(
        Rfc7235.challenges,
        'Invalid WWW-Authenticate header',
      )(s).map(nel => new WWWAuthenticate(nel));
    },
  };
  public static Select: SelectHeader<IdentityF, WWWAuthenticate> =
    new RecurringSelectHeaderMerge(
      WWWAuthenticate.Header,
      Semigroup.of({
        combine_: (xs, ys) =>
          new WWWAuthenticate(xs.values.concatNel(ys.values)),
      }),
    );
}
