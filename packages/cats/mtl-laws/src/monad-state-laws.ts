// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { MonadState } from '@fp4ts/cats-mtl';
import { MonadLaws } from '@fp4ts/cats-laws';
import { IsEq } from '@fp4ts/cats-test-kit';

export const MonadStateLaws = <F, S>(F: MonadState<F, S>) => ({
  ...MonadLaws(F),

  getThenSetDoesNothing: (): IsEq<Kind<F, [void]>> =>
    new IsEq(pipe(F.get, F.flatMap(F.set)), F.unit),

  setThenGetReturnsSetted: (s: S): IsEq<Kind<F, [S]>> =>
    new IsEq(F.productR_(F.set(s), F.get), F.productR_(F.set(s), F.pure(s))),

  setThenSetSetsLast: (s1: S, s2: S): IsEq<Kind<F, [void]>> =>
    new IsEq(F.productR_(F.set(s1), F.set(s2)), F.set(s2)),

  getThenGetGetsOnce: (): IsEq<Kind<F, [S]>> =>
    new IsEq(F.productR_(F.get, F.get), F.get),

  modifyIsGetThenSet: (f: (s: S) => S): IsEq<Kind<F, [void]>> =>
    new IsEq(F.modify(f), pipe(F.get, F.map(f), F.flatMap(F.set))),
});
