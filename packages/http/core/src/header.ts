// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import {
  Either,
  IdentityK,
  Ior,
  List,
  ListK,
  None,
  Option,
  Semigroup,
  Some,
} from '@fp4ts/cats';

export interface Header<H, T extends HeaderType> {
  headerName: string;

  value(a: H): string;

  parse(s: string): Either<Error, H>;
}

export type HeaderType = 'single' | 'recurring';

export class RawHeader {
  public constructor(
    public readonly headerName: string,
    public readonly headerValue: string,
  ) {}
}

export type ToRaw = { toRaw(): List<RawHeader> } | [string, string] | RawHeader;

export interface SelectHeader<F, A> {
  toRaw1(fa: A): RawHeader;
  toRaw(fa: Kind<F, [A]>): List<RawHeader>;
  from(hs: List<RawHeader>): Option<Ior<List<Error>, Kind<F, [A]>>>;
}

export class RecurringSelectHeaderNoMerge<A> implements SelectHeader<ListK, A> {
  public constructor(private readonly h: Header<A, 'recurring'>) {}

  toRaw(fa: List<A>): List<RawHeader> {
    return fa.map(a => this.toRaw1(a));
  }

  toRaw1(a: A): RawHeader {
    return new RawHeader(this.h.headerName, this.h.value(a));
  }

  from(hs: List<RawHeader>): Option<Ior<List<Error>, List<A>>> {
    const rs = hs
      .filter(
        h => h.headerName.toLowerCase() === this.h.headerName.toLowerCase(),
      )
      .map(rh =>
        Ior.fromEither(this.h.parse(rh.headerValue).bimap(List, List)),
      );

    return rs.isEmpty
      ? None
      : Some(
          rs.foldLeft(
            Ior.Both<List<Error>, List<A>>(List.empty, List.empty),
            (r, n) =>
              r.combine(
                List.SemigroupK.algebra<Error>(),
                List.SemigroupK.algebra<A>(),
              )(n),
          ),
        );
  }
}

export class SingleSelectHeader<A> implements SelectHeader<IdentityK, A> {
  public constructor(private readonly h: Header<A, 'single'>) {}

  toRaw(fa: A): List<RawHeader> {
    return List(this.toRaw1(fa));
  }

  toRaw1(fa: A): RawHeader {
    return new RawHeader(this.h.headerName, this.h.value(fa));
  }

  from(hs: List<RawHeader>): Option<Ior<List<Error>, A>> {
    return hs
      .filter(
        h => h.headerName.toLowerCase() === this.h.headerName.toLowerCase(),
      )
      .headOption.map(h =>
        Ior.fromEither(this.h.parse(h.headerValue).leftMap(List)),
      );
  }
}

export class RecurringSelectHeaderMerge<A>
  implements SelectHeader<IdentityK, A>
{
  public constructor(
    private readonly h: Header<A, 'recurring'>,
    private readonly S: Semigroup<A>,
  ) {}

  toRaw(fa: A): List<RawHeader> {
    return List(this.toRaw1(fa));
  }

  toRaw1(a: A): RawHeader {
    return new RawHeader(this.h.headerName, this.h.value(a));
  }

  from(hs: List<RawHeader>): Option<Ior<List<Error>, A>> {
    const rs = hs
      .filter(
        h => h.headerName.toLowerCase() === this.h.headerName.toLowerCase(),
      )
      .map(rh => Ior.fromEither(this.h.parse(rh.headerValue).leftMap(List)));

    return rs.isEmpty
      ? None
      : Some(
          rs.foldLeft1((r, n) =>
            r.combine(List.SemigroupK.algebra<Error>(), this.S)(n),
          ),
        );
  }
}
