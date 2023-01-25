// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Unzip } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ZipLaws } from './zip-laws';

export const UnzipLaws = <F>(F: Unzip<F>) => ({
  ...ZipLaws(F),

  zipUnzipIdentity: <A>(fa: Kind<F, [A]>): IsEq<[Kind<F, [A]>, Kind<F, [A]>]> =>
    new IsEq(F.unzip(F.zip_(fa, fa)), [fa, fa]),

  unzipZipIdentity: <A, B>(fab: Kind<F, [[A, B]]>): IsEq<Kind<F, [[A, B]]>> =>
    new IsEq(F.zip_(...F.unzip(fab)), fab),

  unzipWithConsistentWithUnzip: <A, B>(
    fab: Kind<F, [[A, B]]>,
  ): IsEq<[Kind<F, [A]>, Kind<F, [B]>]> =>
    new IsEq(F.unzip(fab), F.unzipWith_(fab, id)),
});
