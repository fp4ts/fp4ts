// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { F1, Kind } from '@fp4ts/core';
import { Closed } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ProfunctorLaws } from './profunctor-laws';

export const ClosedLaws = <P>(P: Closed<P>) => ({
  ...ProfunctorLaws(P),

  /**
   * lmap (. f) . closed == rmap (. f) . closed
   */
  lmapClosedIsRmapClosed: <A, B, X>(pab: Kind<P, [A, B]>, f: (x: X) => X) =>
    new IsEq<Kind<P, [(x: X) => A, (x: X) => B]>>(
      P.lmap_(P.closed<X>()(pab), (g: (x: X) => A) => F1.compose(g, f)),
      P.rmap_(P.closed<X>()(pab), (g: (x: X) => B) => F1.compose(g, f)),
    ),

  /**
   * closed . closed == dimap uncurry curry . closed
   */
  closedClosedIsClosedDimapUncurryCurry:
    <X, Y>() =>
    <A, B>(pab: Kind<P, [A, B]>) =>
      new IsEq<Kind<P, [(x: X) => (y: Y) => A, (x: X) => (y: Y) => B]>>(
        P.closed<X>()(P.closed<Y>()(pab)),
        P.dimap_(
          P.closed<[X, Y]>()(pab),
          (g: (x: X) => (y: Y) => A) => (xy: [X, Y]) => g(xy[0])(xy[1]),
          g => (x: X) => (y: Y) => g([x, y]),
        ),
      ),

  /**
   * dimap const ($ ()) . closed === id
   */
  closedDimapConstApplyVoidIsIdentity: <A, B>(pab: Kind<P, [A, B]>) =>
    new IsEq<Kind<P, [A, B]>>(
      P.dimap_(
        P.closed<void>()(pab),
        (x: A) => _ => x,
        g => g(undefined),
      ),
      pab,
    ),
});
