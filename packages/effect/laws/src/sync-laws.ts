import { AnyK, Kind, throwError } from '@cats4ts/core';
import { IsEq } from '@cats4ts/cats-test-kit';
import { Sync } from '@cats4ts/effect-kernel';
import { ClockLaws } from './clock-laws';
import { MonadCancelLaws } from './monad-cancel-laws';

export const SyncLaws = <F extends AnyK>(F: Sync<F>): SyncLaws<F> => ({
  ...MonadCancelLaws(F),
  ...ClockLaws(F),

  delayedValueIsPure: <A>(a: A): IsEq<Kind<F, [A]>> =>
    F.delay(() => a)['<=>'](F.pure(a)),

  delayedThrowIsThrowError: (e: Error): IsEq<Kind<F, [never]>> =>
    F.delay(() => throwError(e))['<=>'](F.throwError(e)),

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

    return F.flatten(isWith)['<=>'](F.flatten(isWithout));
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

    return F.flatten(isWith)['<=>'](F.flatten(isWithout));
  },
});

export interface SyncLaws<F extends AnyK>
  extends MonadCancelLaws<F, Error>,
    ClockLaws<F> {
  delayedValueIsPure: <A>(a: A) => IsEq<Kind<F, [A]>>;

  delayedThrowIsThrowError: (e: Error) => IsEq<Kind<F, [never]>>;

  unsequencedDelayIsNoop: <A>(a: A, f: (a: A) => A) => IsEq<Kind<F, [A]>>;

  repeatedDelayNotMemoized: <A>(a: A, f: (a: A) => A) => IsEq<Kind<F, [A]>>;
}
