// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Either, Eq } from '@fp4ts/cats';
import { Codec } from '@fp4ts/schema-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { CodecLaws } from '../codec-laws';

export const CodecSuite = <A>(C: Codec<unknown, any, A>) => {
  const laws = CodecLaws(C);

  return {
    codec: <T>(
      arbA: Arbitrary<A>,
      arbT: Arbitrary<T>,
      EqA: Eq<A>,
      EqT: Eq<T>,
    ) =>
      new RuleSet('codec', [
        [
          'codec decode to encode identity',
          forAll(arbT, laws.codecDecodeToEncodeIdentity)(EqT),
        ],
        [
          'codec encode to decode identity',
          forAll(
            arbA,
            laws.codecEncodeToDecodeIdentity,
          )(Either.Eq(Eq.never as any as Eq<any>, EqA)),
        ],
      ]),
  };
};
