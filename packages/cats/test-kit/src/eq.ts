// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Eq, Eval, FlatMap } from '@fp4ts/cats-core';
import { ExhaustiveCheck } from './exhaustive-check';
import { IndexedStateT, State } from '@fp4ts/cats-core/lib/data';

export const fn1Eq = <A, B>(
  ec: ExhaustiveCheck<A>,
  EqB: Eq<B>,
): Eq<(a: A) => B> =>
  Eq.of({
    equals: (fx, fy) => ec.allValues.all(a => EqB.equals(fx(a), fy(a))),
  });

export const indexedStateTEq = <F, SA, SB, A>(
  ec: ExhaustiveCheck<SA>,
  EqSB: Eq<SB>,
  EqA: Eq<A>,
  mkEqFX: <X>(EqX: Eq<X>) => Eq<Kind<F, [X]>>,
  F: FlatMap<F>,
): Eq<IndexedStateT<F, SA, SB, A>> =>
  Eq.by(fn1Eq(ec, mkEqFX(Eq.tuple2(EqSB, EqA))), fsasba => fsasba.run(F));

export const stateEq = <S, A>(
  ec: ExhaustiveCheck<S>,
  EqS: Eq<S>,
  EqA: Eq<A>,
): Eq<State<S, A>> => indexedStateTEq(ec, EqS, EqA, Eval.Eq, Eval.Monad);
