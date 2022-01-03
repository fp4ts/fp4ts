// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { MonadCancel } from '@fp4ts/effect-kernel';
import { MonadErrorLaws } from '@fp4ts/cats-laws';
import { IsEq } from '@fp4ts/cats-test-kit';

export const MonadCancelLaws = <F, E>(
  F: MonadCancel<F, E>,
): MonadCancelLaws<F, E> => ({
  ...MonadErrorLaws(F),

  uncancelablePollIsIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.uncancelable(poll => poll(fa)),
      fa,
    ),

  uncancelableIgnoredPollEliminatesNesting: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.uncancelable(() => F.uncancelable(() => fa)),
      F.uncancelable(() => fa),
    ),

  uncancelablePollInverseNestIsUncancelable: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.uncancelable(op => F.uncancelable(ip => op(ip(fa)))),
      F.uncancelable(() => fa),
    ),

  uncancelableEliminatesOnCancel: <A>(
    fa: Kind<F, [A]>,
    fin: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.uncancelable(() => F.onCancel_(fa, fin)),
      F.uncancelable(() => fa),
    ),

  onCancelAssociatesOverUncancelableBoundary: <A>(
    fa: Kind<F, [A]>,
    fin: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.uncancelable(() => F.onCancel_(fa, fin)),
      F.onCancel_(
        F.uncancelable(() => fa),
        fin,
      ),
    ),

  onCancelImpliesUncancelable: <A>(
    fa: Kind<F, [A]>,
    fin1: Kind<F, [void]>,
    fin2: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.onCancel_(
        F.onCancel_(
          fa,
          F.uncancelable(() => fin1),
        ),
        fin2,
      ),
      F.onCancel_(F.onCancel_(fa, fin1), fin2),
    ),

  uncancelableFinalizers: (fin: Kind<F, [void]>): IsEq<Kind<F, [void]>> =>
    new IsEq(
      F.onCancel_(
        F.canceled,
        F.uncancelable(() => fin),
      ),
      F.onCancel_(F.canceled, fin),
    ),

  // For Cancelable

  canceledAssociatesLeftOverFlatMap: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.productR_(
        F.canceled,
        F.map_(fa, () => undefined),
      ),
      F.canceled,
    ),

  // For Uncancelable

  uncancelableIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.uncancelable(() => fa),
      fa,
    ),

  canceledUnitIdentity: (): IsEq<Kind<F, [void]>> =>
    new IsEq(F.canceled, F.unit),
});

export interface MonadCancelLaws<F, E> extends MonadErrorLaws<F, E> {
  uncancelablePollIsIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  uncancelableIgnoredPollEliminatesNesting: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;

  uncancelablePollInverseNestIsUncancelable: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;

  uncancelableEliminatesOnCancel: <A>(
    fa: Kind<F, [A]>,
    fin: Kind<F, [void]>,
  ) => IsEq<Kind<F, [A]>>;

  onCancelAssociatesOverUncancelableBoundary: <A>(
    fa: Kind<F, [A]>,
    fin: Kind<F, [void]>,
  ) => IsEq<Kind<F, [A]>>;

  onCancelImpliesUncancelable: <A>(
    fa: Kind<F, [A]>,
    fin1: Kind<F, [void]>,
    fin2: Kind<F, [void]>,
  ) => IsEq<Kind<F, [A]>>;

  uncancelableFinalizers: (fin: Kind<F, [void]>) => IsEq<Kind<F, [void]>>;

  // For Cancelable

  canceledAssociatesLeftOverFlatMap: <A>(
    fa: Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;

  // For Uncancelable

  uncancelableIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  canceledUnitIdentity: () => IsEq<Kind<F, [void]>>;
}
