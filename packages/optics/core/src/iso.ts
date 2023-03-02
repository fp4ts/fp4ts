// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Functor } from '@fp4ts/cats';
import { Profunctor } from '@fp4ts/cats-profunctor';
import { id, Kind, lazy } from '@fp4ts/core';
import { Optic } from './internal';
import { IndexPreservingPLens } from './lens';
import { PPrism } from './prism';

export interface PIso<in S, out T, out A, in B>
  extends IndexPreservingPLens<S, T, A, B>,
    PPrism<S, T, A, B> {
  readonly S: (s: S) => void;
  readonly T: () => T;
  readonly A: () => A;
  readonly B: (b: B) => void;

  readonly runOptic: <F, P>(
    F: Functor<F>,
    P: Profunctor<P>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>;
}

export type Iso<S, A> = PIso<S, S, A, A>;

// -- Constructors

export const iso = lazy(
  <A>(): Iso<A, A> =>
    mkIso<A, A, A, A>(<F, P>(F: Functor<F>, P: Profunctor<P>) => id),
) as <A>() => Iso<A, A>;

// -- Private helpers

const mkIso = <S, T, A, B>(
  apply: <F, P>(
    F: Functor<F>,
    P: Profunctor<P>,
  ) => (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [S, Kind<F, [T]>]>,
): PIso<S, T, A, B> => new Optic(apply as any) as any;
