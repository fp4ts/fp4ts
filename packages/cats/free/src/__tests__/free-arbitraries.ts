// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';

import { Free } from '../free';

interface FreeConstraints {
  readonly minDepth?: number;
  readonly maxDepth?: number;
}
export const fp4tsFree = <F, A>(
  arbFA: Arbitrary<Kind<F, [A]>>,
  arbA: Arbitrary<A>,
  constraints: FreeConstraints = {},
): Arbitrary<Free<F, A>> => {
  const minDepth =
    constraints.minDepth != null && constraints.minDepth >= 0
      ? constraints.minDepth
      : 0;
  const maxDepth =
    constraints.maxDepth != null &&
    constraints.maxDepth <= Number.MAX_SAFE_INTEGER
      ? constraints.maxDepth
      : Math.min(2 * minDepth + 10, 0x7fffffff);
  const maxDepthA = fc.integer(minDepth, maxDepth);

  const genFree = fc.memo((maxDepth: number): Arbitrary<Free<F, A>> => {
    const base = fc.oneof(
      arbFA.map(Free.suspend),
      arbA.map(x => Free.pure<F, A>(x)),
    );

    const nextDepth = fc.integer(1, Math.max(1, maxDepth - 1));

    const flatMapped = fc
      .tuple(nextDepth, nextDepth)
      .chain(([fDepth, freeDepth]) =>
        fc
          .tuple(genFree(freeDepth), fc.func<[A], Free<F, A>>(genFree(fDepth)))
          .map(([fa, f]) => fa.flatMap(f)),
      );

    return maxDepth <= 1 ? base : fc.oneof(base, flatMapped);
  });

  return maxDepthA.chain(genFree);
};
