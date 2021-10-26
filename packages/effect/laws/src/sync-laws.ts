import { Kind, throwError } from '@fp4ts/core';
import { Sync } from '@fp4ts/effect-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';

import { UniqueLaws } from './unique-laws';
import { ClockLaws } from './clock-laws';
import { MonadCancelLaws } from './monad-cancel-laws';

export const SyncLaws = <F>(F: Sync<F>): SyncLaws<F> => ({
  ...MonadCancelLaws(F),
  ...ClockLaws(F),
  ...UniqueLaws(F),

  delayedValueIsPure: <A>(a: A): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.delay(() => a),
      F.pure(a),
    ),

  delayedThrowIsThrowError: (e: Error): IsEq<Kind<F, [never]>> =>
    new IsEq(
      F.delay(() => throwError(e)),
      F.throwError(e),
    ),

  unsequencedDelayIsNoop: <A>(a: A, f: (a: A) => A): IsEq<Kind<F, [A]>> => {
    const isWith = F.delay(() => {
      let cur = a;
      const _ = F.delay(() => (cur = f(cur)));
      return F.delay(() => cur);
    });

    const isWithout = F.delay(() => {
      let cur = a;
      cur = a;
      return F.delay(() => cur);
    });

    return new IsEq(F.flatten(isWith), F.flatten(isWithout));
  },

  repeatedDelayNotMemoized: <A>(a: A, f: (a: A) => A): IsEq<Kind<F, [A]>> => {
    const isWith = F.delay(() => {
      let cur = a;

      const changeF = F.delay(() => (cur = f(cur)));
      return F.productR_(changeF, changeF);
    });

    const isWithout = F.delay(() => {
      let cur = a;

      return F.delay(() => (cur = f(f(cur))));
    });

    return new IsEq(F.flatten(isWith), F.flatten(isWithout));
  },
});

export interface SyncLaws<F>
  extends MonadCancelLaws<F, Error>,
    ClockLaws<F>,
    UniqueLaws<F> {
  delayedValueIsPure: <A>(a: A) => IsEq<Kind<F, [A]>>;

  delayedThrowIsThrowError: (e: Error) => IsEq<Kind<F, [never]>>;

  unsequencedDelayIsNoop: <A>(a: A, f: (a: A) => A) => IsEq<Kind<F, [A]>>;

  repeatedDelayNotMemoized: <A>(a: A, f: (a: A) => A) => IsEq<Kind<F, [A]>>;
}
