// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { CommutativeMonoid } from '@fp4ts/cats-kernel';
import { UnorderedFoldable } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const UnorderedFoldableLaws = <F>(
  F: UnorderedFoldable<F>,
): UnorderedFoldableLaws<F> => ({
  unorderedFoldConsistentWithUnorderedFoldMap: <A>(
    fa: Kind<F, [A]>,
    M: CommutativeMonoid<A>,
  ): IsEq<A> =>
    new IsEq(F.unorderedFoldMap_(M)(fa, id), F.unorderedFold(M)(fa)),

  allConsistentWithAny: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ): boolean => {
    if (!F.all_(fa, p)) return true;

    const negationExists = F.any_(fa, x => !p(x));
    return !negationExists && (F.isEmpty(fa) || F.any_(fa, p));
  },

  anyLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.any_(fa, () => {
      i += 1;
      return true;
    });
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  allLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.all_(fa, () => {
      i += 1;
      return false;
    });
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  allEmpty: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean): boolean =>
    !F.isEmpty(fa) || F.all_(fa, p),

  nonEmptyRef: <A>(fa: Kind<F, [A]>): IsEq<boolean> =>
    new IsEq(F.nonEmpty(fa), !F.isEmpty(fa)),
});

export interface UnorderedFoldableLaws<F> {
  unorderedFoldConsistentWithUnorderedFoldMap: <A>(
    fa: Kind<F, [A]>,
    M: CommutativeMonoid<A>,
  ) => IsEq<A>;

  allConsistentWithAny: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;

  anyLazy: <A>(fa: Kind<F, [A]>) => boolean;

  allLazy: <A>(fa: Kind<F, [A]>) => boolean;

  allEmpty: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;

  nonEmptyRef: <A>(fa: Kind<F, [A]>) => IsEq<boolean>;
}
