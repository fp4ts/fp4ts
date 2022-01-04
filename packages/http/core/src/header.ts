// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either, IdentityK, Ior, List, Option } from '@fp4ts/cats';

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
  toRaw1(fa: Kind<F, [A]>): RawHeader;
  toRaw(fa: Kind<F, [A]>): List<RawHeader>;
  from(hs: List<RawHeader>): Option<Ior<List<Error>, Kind<F, [A]>>>;
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
      .filter(h => h.headerName === this.h.headerName)
      .headOption.map(h =>
        Ior.fromEither(this.h.parse(h.headerValue).leftMap(List)),
      );
  }
}
