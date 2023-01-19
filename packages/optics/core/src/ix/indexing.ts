// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Applicative, Contravariant, Functor } from '@fp4ts/cats';

export type Indexing<F, A> = (prev: number) => [number, Kind<F, [A]>];

export const Indexing: IndexingObj = function () {};

interface IndexingObj {
  Functor<F>(F: Functor<F>): Functor<$<IndexingF, [F]>>;
  Contravariant<F>(F: Contravariant<F>): Contravariant<$<IndexingF, [F]>>;
  Applicative<F>(F: Applicative<F>): Applicative<$<IndexingF, [F]>>;
}

const indexingFunctor = <F>(F: Functor<F>) =>
  Functor.of<$<IndexingF, [F]>>({
    map_: (fa, f) => i => {
      const [j, fx] = fa(i);
      return [j, F.map_(fx, f)];
    },
  });

const indexingContravariant = <F>(F: Contravariant<F>) =>
  Contravariant.of<$<IndexingF, [F]>>({
    contramap_: (fa, f) => i => {
      const [j, fx] = fa(i);
      return [j, F.contramap_(fx, f)];
    },
  });

const indexingApplicative = <F>(F: Applicative<F>) =>
  Applicative.of<$<IndexingF, [F]>>({
    ...indexingFunctor(F),
    pure: x => i => [i, F.pure(x)],
    ap_: (ff, fa) => i => {
      const [j, ffx] = ff(i);
      const [k, fx] = fa(j);
      return [k, F.ap_(ffx, fx)];
    },
  });

Indexing.Functor = indexingFunctor;
Indexing.Contravariant = indexingContravariant;
Indexing.Applicative = indexingApplicative;

// -- HKT

export interface IndexingF extends TyK<[unknown, unknown]> {
  [$type]: Indexing<TyVar<this, 0>, TyVar<this, 1>>;
}
