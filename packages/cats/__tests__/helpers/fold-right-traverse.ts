// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind } from '@fp4ts/core';
import { Applicative, TraverseStrategy } from '@fp4ts/cats-core';
import * as A from '@fp4ts/cats-core/lib/internal/array-helpers';

export function foldRightTraverse<G, A, B>(
  G: Applicative<G>,
  xs: A[],
  f: (a: A) => Kind<G, [B]>,
): Kind<G, [B[]]> {
  const sz = xs.length;
  const go = <Rhs>(
    Rhs: TraverseStrategy<G, Rhs>,
    i: number,
    r: Kind<Rhs, [A.Cons<B>]>,
  ): Kind<Rhs, [A.Cons<B>]> =>
    i >= sz
      ? r
      : Rhs.map2(
          Rhs.toRhs(() => f(xs[i])),
          Rhs.defer(() => go(Rhs, i + 1, r)),
          A.cons,
        );

  return G.map_(
    G.TraverseStrategy(Rhs =>
      Rhs.toG(
        go(
          Rhs,
          0,
          Rhs.toRhs(() => G.pure(A.Nil as A.Cons<B>)),
        ),
      ),
    ),
    A.consToArray,
  );
}

export function foldRightTraverse_<G, A>(
  G: Applicative<G>,
  xs: A[],
  f: (a: A) => Kind<G, [unknown]>,
): Kind<G, [void]> {
  const sz = xs.length;
  const go = (i: number, r: Eval<Kind<G, [void]>>): Eval<Kind<G, [void]>> =>
    i >= sz
      ? r
      : G.map2Eval_(
          f(xs[i]),
          Eval.defer(() => go(i + 1, r)),
          () => {},
        );
  return go(0, Eval.now(G.unit)).value;
}
