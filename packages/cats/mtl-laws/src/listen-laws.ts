// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst, Kind } from '@fp4ts/core';
import { Listen } from '@fp4ts/cats-mtl';
import { IsEq } from '@fp4ts/cats-test-kit';
import { TellLaws } from './tell-laws';

export const ListenLaws = <F, W>(F: Listen<F, W>) => ({
  ...TellLaws(F),

  listenRespectsTell: (w: W): IsEq<Kind<F, [[void, W]]>> =>
    new IsEq(
      F.listen(F.tell(w)),
      F.map_(F.tell(w), () => [undefined, w]),
    ),

  listenAddsNoEffects: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.map_(F.listen(fa), fst), fa),
});
