// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, IdentityK, List, Semigroup } from '@fp4ts/cats';
import {
  Header,
  SelectHeader,
  RawHeader,
  RecurringSelectHeaderMerge,
} from '../header';
import { MediaRange } from '../media-type';

export type Accept = AcceptHeader;
export const Accept: AcceptObj = function (...mt) {
  return new AcceptHeader(List.fromArray(mt));
};

class AcceptHeader {
  public constructor(public readonly mediaRanges: List<MediaRange>) {}

  public toRaw(): List<RawHeader> {
    return Accept.Select.toRaw(this);
  }
}

Accept.Header = {
  headerName: 'Accept',
  value(a: AcceptHeader): string {
    return a.mediaRanges.map(mr => `${mr.mainType}/*`).toArray.join(';');
  },
  parse(s: string): Either<Error, AcceptHeader> {
    const xs = List.fromArray(s.split(';'));
    return xs
      .traverse(Either.Applicative<Error>())(x => MediaRange.fromString(x))
      .map(mrs => new AcceptHeader(mrs));
  },
};

Accept.Select = new RecurringSelectHeaderMerge(
  Accept.Header,
  Semigroup.of({
    combine_: (x, y) => new AcceptHeader(x.mediaRanges['+++'](y().mediaRanges)),
  }),
);

interface AcceptObj {
  (...mt: MediaRange[]): AcceptHeader;
  Header: Header<Accept, 'recurring'>;
  Select: SelectHeader<IdentityK, Accept>;
}
