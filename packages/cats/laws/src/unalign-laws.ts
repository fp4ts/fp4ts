// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Unalign } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { AlignLaws } from './align-laws';
import { Ior } from '@fp4ts/cats-core/lib/data';

export const UnalignLaws = <F>(F: Unalign<F>) => ({
  ...AlignLaws(F),

  alignUnalignIdentity: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<[Kind<F, [A]>, Kind<F, [A]>]> =>
    new IsEq(F.unalign(F.align_(fa, fa)), [fa, fa]),

  unalignWithConsistentWithUnalign: <A, B>(
    fab: Kind<F, [Ior<A, B>]>,
  ): IsEq<[Kind<F, [A]>, Kind<F, [B]>]> =>
    new IsEq(F.unalign(fab), F.unalignWith_(fab, id)),
});
