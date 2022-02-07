// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';

import { Tuple2K, Tuple2kK } from './tuple2-k';

export const tuple2KEq: <F, G, A>(
  EF: Eq<Kind<F, [A]>>,
  EG: Eq<Kind<G, [A]>>,
) => Eq<Tuple2K<F, G, A>> = (EF, EG) =>
  Eq.of({
    equals: (lhs, rhs) =>
      EF.equals(lhs[0], rhs[0]) && EG.equals(lhs[1], rhs[1]),
  });

export const tuple2KFunctor: <F, G>(
  F: Functor<F>,
  G: Functor<G>,
) => Functor<$<Tuple2kK, [F, G]>> = (F, G) =>
  Functor.of({
    map_: (fa, f) => [F.map_(fa[0], f), G.map_(fa[1], f)],
  });

export const tuple2KApply: <F, G>(
  F: Apply<F>,
  G: Apply<G>,
) => Apply<$<Tuple2kK, [F, G]>> = (F, G) =>
  Apply.of({
    ...tuple2KFunctor(F, G),
    ap_: (ff, fa) => {
      const [fstF, sndF] = [ff[0], ff[1]];
      const [fstA, sndA] = [fa[0], fa[1]];
      return [F.ap_(fstF, fstA), G.ap_(sndF, sndA)];
    },
  });

export const tuple2KApplicative: <F, G>(
  F: Applicative<F>,
  G: Applicative<G>,
) => Applicative<$<Tuple2kK, [F, G]>> = (F, G) =>
  Applicative.of({
    ...tuple2KApply(F, G),
    pure: a => [F.pure(a), G.pure(a)],
  });
