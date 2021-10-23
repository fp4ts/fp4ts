import { Kind } from '@cats4ts/core';
import { Applicative } from '@cats4ts/cats';
import { Unique } from '@cats4ts/effect-kernel';
import { IsEq } from '@cats4ts/cats-test-kit';

export const UniqueLaws = <F>(
  F: Unique<F> & Applicative<F>,
): UniqueLaws<F> => ({
  uniqueness: (): IsEq<Kind<F, [boolean]>> =>
    new IsEq(
      F.map2_(F.unique, F.unique)((l, r) => l.notEquals(r)),
      F.pure(true),
    ),
});

export interface UniqueLaws<F> {
  readonly uniqueness: () => IsEq<Kind<F, [boolean]>>;
}
