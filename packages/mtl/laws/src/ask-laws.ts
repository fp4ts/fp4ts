// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Ask } from '@fp4ts/mtl-core';

export const AskLaws = <F, R>(F: Ask<F, R>) => ({
  askAddsNoEffects: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.productR_(F.ask(), fa), fa),

  readerIsAskAndMap: <A>(f: (r: R) => A): IsEq<Kind<F, [A]>> =>
    new IsEq(F.map_(F.ask(), f), F.reader(f)),
});
