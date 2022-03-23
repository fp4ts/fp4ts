// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import {
  Either,
  IdentityF,
  Ior,
  List,
  None,
  NonEmptyList,
  NonEmptyListF,
  Option,
  Semigroup,
  Some,
} from '@fp4ts/cats';

type Nel<A> = NonEmptyList<A>;

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

  public toString(): string {
    return `${this.headerName}: ${this.headerValue}`;
  }
}

export type ToRaw =
  | { toRaw(): NonEmptyList<RawHeader> }
  | [string, string]
  | RawHeader;

export interface SelectHeader<F, A> {
  readonly header: Header<A, any>;
  toRaw1(fa: A): RawHeader;
  toRaw(fa: Kind<F, [A]>): NonEmptyList<RawHeader>;
  from(hs: List<RawHeader>): Option<Ior<NonEmptyList<Error>, Kind<F, [A]>>>;
}

export class RecurringSelectHeaderNoMerge<A>
  implements SelectHeader<NonEmptyListF, A>
{
  public constructor(public readonly header: Header<A, 'recurring'>) {}

  toRaw(fa: NonEmptyList<A>): NonEmptyList<RawHeader> {
    return fa.map(a => this.toRaw1(a));
  }

  toRaw1(a: A): RawHeader {
    return new RawHeader(this.header.headerName, this.header.value(a));
  }

  from(hs: List<RawHeader>): Option<Ior<Nel<Error>, Nel<A>>> {
    const S = NonEmptyList.SemigroupK;
    return hs.foldLeft(None as Option<Ior<Nel<Error>, Nel<A>>>, (a, h) => {
      if (h.headerName.toLowerCase() !== this.header.headerName.toLowerCase())
        return a;

      const aa = Ior.fromEither(this.header.parse(h.headerValue)).bimap(
        NonEmptyList.pure,
        NonEmptyList.pure,
      );

      return a.fold(
        () => Some(aa),
        a => Some(a.combine(S.algebra(), S.algebra())(aa)),
      );
    });
  }
}

export class SingleSelectHeader<A> implements SelectHeader<IdentityF, A> {
  public constructor(public readonly header: Header<A, 'single'>) {}

  toRaw(fa: A): NonEmptyList<RawHeader> {
    return NonEmptyList.pure(this.toRaw1(fa));
  }

  toRaw1(fa: A): RawHeader {
    return new RawHeader(this.header.headerName, this.header.value(fa));
  }

  from(hs: List<RawHeader>): Option<Ior<NonEmptyList<Error>, A>> {
    return hs
      .filter(
        h =>
          h.headerName.toLowerCase() === this.header.headerName.toLowerCase(),
      )
      .map(h =>
        Ior.fromEither(
          this.header.parse(h.headerValue).leftMap(NonEmptyList.pure),
        ),
      ).headOption;
  }
}

export class RecurringSelectHeaderMerge<A>
  implements SelectHeader<IdentityF, A>
{
  public constructor(
    public readonly header: Header<A, 'recurring'>,
    private readonly S: Semigroup<A>,
  ) {}

  toRaw(fa: A): NonEmptyList<RawHeader> {
    return NonEmptyList.pure(this.toRaw1(fa));
  }

  toRaw1(a: A): RawHeader {
    return new RawHeader(this.header.headerName, this.header.value(a));
  }

  from(hs: List<RawHeader>): Option<Ior<NonEmptyList<Error>, A>> {
    return hs.foldLeft(None as Option<Ior<NonEmptyList<Error>, A>>, (a, h) => {
      if (h.headerName.toLowerCase() !== this.header.headerName.toLowerCase())
        return a;

      const aa = Ior.fromEither(
        this.header.parse(h.headerValue).leftMap(NonEmptyList.pure),
      );

      const S = NonEmptyList.SemigroupK;
      return a.fold(
        () => Some(aa),
        a => Some(a.combine(S.algebra(), this.S)(aa)),
      );
    });
  }
}
