import { AnyK, Kind, pipe } from '@cats4ts/core';
import { Right, Left, None } from '@cats4ts/cats';
import { Async } from '@cats4ts/effect-kernel';
import { IsEq } from '@cats4ts/cats-test-kit';

import { SyncLaws } from './sync-laws';
import { TemporalLaws } from './temporal-laws';

// TODO - define return type
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const AsyncLaws = <F extends AnyK>(F: Async<F>) => ({
  ...TemporalLaws(F),
  ...SyncLaws(F),

  asyncRightIsUncancelableSequencedPure: <A>(
    a: A,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    pipe(
      F.async<A>(k =>
        F.productR_(
          F.delay(() => k(Right(a))),
          F.map_(fv, () => None),
        ),
      ),
    )['<=>'](
      F.productR_(
        F.uncancelable(() => fv),
        F.pure(a),
      ),
    ),

  asyncLeftIsUncancelableSequencedRaiseError: (
    e: Error,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [never]>> =>
    pipe(
      F.async<never>(k =>
        F.productR_(
          F.delay(() => k(Left(e))),
          F.map_(fv, () => None),
        ),
      ),
    )['<=>'](
      F.productR_(
        F.uncancelable(() => fv),
        F.throwError(e),
      ),
    ),

  asyncRepeatedCallbackIgnored: <A>(a: A): IsEq<Kind<F, [A]>> =>
    pipe(
      F.async<A>(k =>
        F.map_(
          F.productR_(
            F.delay(() => k(Right(a))),
            F.delay(() => k(Right(a))),
          ),
          () => None,
        ),
      ),
    )['<=>'](F.pure(a)),

  asyncCancelIsUnsequencedOnCompletion: <A>(
    a: A,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    F.async<A>(k =>
      F.productR_(
        F.delay(() => k(Right(a))),
        F.pure(fv),
      ),
    )['<=>'](F.pure(a)),

  asyncCancelIsUnsequencedOnThrow: (
    e: Error,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [never]>> =>
    F.async<never>(k =>
      F.productR_(
        F.delay(() => k(Left(e))),
        F.pure(fv),
      ),
    )['<=>'](F.throwError(e)),

  neverIsDerivedFromAsync: (): IsEq<Kind<F, [never]>> =>
    F.never['<=>'](F.async_(() => F.unit)),
});
