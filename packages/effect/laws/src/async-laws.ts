// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Right, Left, None, Some } from '@fp4ts/cats';
import { Async, ExecutionContext } from '@fp4ts/effect-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';

import { SyncLaws } from './sync-laws';
import { TemporalLaws } from './temporal-laws';

export const AsyncLaws = <F>(F: Async<F>): AsyncLaws<F> => ({
  ...TemporalLaws(F),
  ...SyncLaws(F),

  asyncRightIsUncancelableSequencedPure: <A>(
    a: A,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.async<A>(k =>
        F.productR_(
          F.delay(() => k(Right(a))),
          F.map_(fv, () => None),
        ),
      ),
      F.productR_(
        F.uncancelable(() => fv),
        F.pure(a),
      ),
    ),

  asyncLeftIsUncancelableSequencedThrowError: (
    e: Error,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [never]>> =>
    new IsEq(
      F.async<never>(k =>
        F.productR_(
          F.delay(() => k(Left(e))),
          F.map_(fv, () => None),
        ),
      ),
      F.productR_(
        F.uncancelable(() => fv),
        F.throwError(e),
      ),
    ),

  asyncRepeatedCallbackIgnored: <A>(a: A): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.async<A>(k =>
        F.map_(
          F.productR_(
            F.delay(() => k(Right(a))),
            F.delay(() => k(Right(a))),
          ),
          () => None,
        ),
      ),
      F.pure(a),
    ),

  asyncCancelIsUnsequencedOnCompletion: <A>(
    a: A,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.async<A>(k =>
        F.productR_(
          F.delay(() => k(Right(a))),
          F.pure(Some(fv)),
        ),
      ),
      F.pure(a),
    ),

  asyncCancelIsUnsequencedOnThrow: (
    e: Error,
    fv: Kind<F, [void]>,
  ): IsEq<Kind<F, [never]>> =>
    new IsEq(
      F.async<never>(k =>
        F.productR_(
          F.delay(() => k(Left(e))),
          F.pure(Some(fv)),
        ),
      ),
      F.throwError(e),
    ),

  neverIsDerivedFromAsync: (): IsEq<Kind<F, [never]>> =>
    new IsEq(
      F.never,
      F.async_(() => F.unit),
    ),

  executionContextCommutativity: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [ExecutionContext]>> =>
    new IsEq(
      F.productR_(fa, F.readExecutionContext),
      F.productL_(F.readExecutionContext, fa),
    ),

  executeOnLocalPure: (
    ec: ExecutionContext,
  ): IsEq<Kind<F, [ExecutionContext]>> =>
    new IsEq(
      F.executeOn_(F.readExecutionContext, ec),
      F.executeOn_(F.pure(ec), ec),
    ),

  executeOnPureIdentity: <A>(a: A, ec: ExecutionContext): IsEq<Kind<F, [A]>> =>
    new IsEq(F.executeOn_(F.pure(a), ec), F.pure(a)),

  executeOnThrowError: (
    e: Error,
    ec: ExecutionContext,
  ): IsEq<Kind<F, [never]>> =>
    new IsEq(F.executeOn_(F.throwError(e), ec), F.throwError(e)),

  executeOnCanceledIdentity: (ec: ExecutionContext): IsEq<Kind<F, [void]>> =>
    new IsEq(F.executeOn_(F.canceled, ec), F.canceled),

  executeOnNeverIdentity: (ec: ExecutionContext): IsEq<Kind<F, [never]>> =>
    new IsEq(F.executeOn_(F.never, ec), F.never),
});

export interface AsyncLaws<F> extends SyncLaws<F>, TemporalLaws<F, Error> {
  asyncRightIsUncancelableSequencedPure: <A>(
    a: A,
    fv: Kind<F, [void]>,
  ) => IsEq<Kind<F, [A]>>;

  asyncLeftIsUncancelableSequencedThrowError: (
    e: Error,
    fv: Kind<F, [void]>,
  ) => IsEq<Kind<F, [never]>>;

  asyncRepeatedCallbackIgnored: <A>(a: A) => IsEq<Kind<F, [A]>>;

  asyncCancelIsUnsequencedOnCompletion: <A>(
    a: A,
    fv: Kind<F, [void]>,
  ) => IsEq<Kind<F, [A]>>;

  asyncCancelIsUnsequencedOnThrow: (
    e: Error,
    fv: Kind<F, [void]>,
  ) => IsEq<Kind<F, [never]>>;

  neverIsDerivedFromAsync: () => IsEq<Kind<F, [never]>>;

  executionContextCommutativity: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [ExecutionContext]>>;

  executeOnLocalPure: (
    ec: ExecutionContext,
  ) => IsEq<Kind<F, [ExecutionContext]>>;

  executeOnPureIdentity: <A>(a: A, ec: ExecutionContext) => IsEq<Kind<F, [A]>>;

  executeOnThrowError: (
    e: Error,
    ec: ExecutionContext,
  ) => IsEq<Kind<F, [never]>>;

  executeOnCanceledIdentity: (ec: ExecutionContext) => IsEq<Kind<F, [void]>>;

  executeOnNeverIdentity: (ec: ExecutionContext) => IsEq<Kind<F, [never]>>;
}
