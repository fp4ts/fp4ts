// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Tell } from '@fp4ts/cats-mtl';
import { IsEq } from '@fp4ts/cats-test-kit';

export const TellLaws = <F, W>(F: Tell<F, W>) => ({
  writerIsTellAndMap: <A>(a: A, w: W): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.map_(F.tell(w), () => a),
      F.writer_(a, w),
    ),
});
