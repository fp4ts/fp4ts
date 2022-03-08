// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either, Option, Right, Some } from '@fp4ts/cats';
import { Header, Headers, HeaderType, SelectHeader } from '@fp4ts/http-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const HeaderLaws = <A, T extends HeaderType, F>(
  H: Header<A, T>,
  S: SelectHeader<F, A>,
) => ({
  headerValueParseIdentity: (a: A): IsEq<Either<Error, A>> =>
    new IsEq(H.parse(H.value(a)), Right(a)),

  headerToStringIsNameColonValue: (a: A): IsEq<string> =>
    new IsEq(`${a}`, `${H.headerName}: ${H.value(a)}`),

  selectHeaderToRawFromIdentity: (
    fa: Kind<F, [A]>,
  ): IsEq<Option<Kind<F, [A]>>> =>
    new IsEq(
      S.from(S.toRaw(fa).toList).flatMap(ior => ior.toOption),
      Some(fa),
    ),

  headersMatchIdentity: (fa: Kind<F, [A]>): IsEq<Option<Kind<F, [A]>>> =>
    new IsEq(new Headers(S.toRaw(fa).toList).get(S), Some(fa)),
});
