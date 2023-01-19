// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Either, Eq, Option } from '@fp4ts/cats';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { Header, HeaderType, SelectHeader } from '@fp4ts/http-core';
import { HeaderLaws } from '../header-laws';

export const HeaderSuite = <A, T extends HeaderType, F>(
  H: Header<A, T>,
  S: SelectHeader<F, A>,
) => {
  const laws = HeaderLaws(H, S);

  return {
    header: (
      arbA: Arbitrary<A>,
      arbFA: Arbitrary<Kind<F, [A]>>,
      EqA: Eq<A>,
      EqFA: Eq<Kind<F, [A]>>,
    ) =>
      new RuleSet('Header', [
        [
          'H.parse(H.value(a)) <-> Right(a)',
          forAll(
            arbA,
            laws.headerValueParseIdentity,
          )(Either.Eq(Eq.Error.strict, EqA)),
        ],
        [
          'a.toString() <-> "H.headerName: H.value(a)"',
          forAll(
            arbA,
            laws.headerToStringIsNameColonValue,
          )(Eq.fromUniversalEquals()),
        ],
        [
          'S.from(S.toRaw(fa)) <-> Some(fa)',
          forAll(arbFA, laws.selectHeaderToRawFromIdentity)(Option.Eq(EqFA)),
        ],
        [
          'Headers(S.toRaw(fa)).get(S) <-> Some(fa)',
          forAll(arbFA, laws.headersMatchIdentity)(Option.Eq(EqFA)),
        ],
      ]),
  };
};
