// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, IdentityF, List, NonEmptyList, Semigroup } from '@fp4ts/cats';
import {
  Header,
  SelectHeader,
  RawHeader,
  RecurringSelectHeaderMerge,
} from '../header';
import { Challenge } from '../challenge';
import { ParseResult, Rfc7235 } from '../parsing';

export type WWWAuthenticate = WWWAuthenticateHeader;
export const WWWAuthenticate: WWWAuthenticateObj = function (head, ...tail) {
  return new WWWAuthenticateHeader(NonEmptyList(head, List.fromArray(tail)));
};

export class WWWAuthenticateHeader {
  public constructor(public readonly values: NonEmptyList<Challenge>) {}

  public toRaw(): NonEmptyList<RawHeader> {
    return WWWAuthenticate.Select.toRaw(this);
  }
}

WWWAuthenticate.Header = {
  headerName: 'WWW-Authenticate',
  value(a: WWWAuthenticateHeader): string {
    return a.values.toArray.join(', ');
  },
  parse(s: string): Either<Error, WWWAuthenticateHeader> {
    return ParseResult.fromParser(
      Rfc7235.challenges,
      'Invalid WWW-Authenticate header',
    )(s).map(nel => new WWWAuthenticateHeader(nel));
  },
};

WWWAuthenticate.Select = new RecurringSelectHeaderMerge(
  WWWAuthenticate.Header,
  Semigroup.of({
    combine_: (xs, ys) =>
      new WWWAuthenticateHeader(xs.values.concatNel(ys().values)),
  }),
);

interface WWWAuthenticateObj {
  (head: Challenge, ...tail: Challenge[]): WWWAuthenticateHeader;
  Header: Header<WWWAuthenticate, 'recurring'>;
  Select: SelectHeader<IdentityF, WWWAuthenticate>;
}
