// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { Iso, reverseGet, get } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

// import { OptionalLaws } from './optional-laws';

export const IsoLaws = <S, A>(iso: Iso<S, A>) => ({
  // ...OptionalLaws(iso),

  roundTripOneWay: (s: S): IsEq<S> =>
    new IsEq(reverseGet(iso)(pipe(iso, get)(s)), s),

  roundTripOtherWay: (a: A): IsEq<A> =>
    new IsEq(pipe(iso, get)(reverseGet(iso)(a)), a),
});
