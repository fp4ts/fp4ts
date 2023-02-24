// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Eval, TyK, TyVar } from '@fp4ts/core';
import { MonadDefer } from '@fp4ts/cats-core';

export type State<S, A> = (s: S) => Eval<[A, S]>;
export function State<S, A>(runState: (s: S) => Eval<[A, S]>): State<S, A> {
  return runState;
}

State.modify =
  <S>(f: (s: S) => S): State<S, void> =>
  (s: S) =>
    Eval.later(() => [undefined, f(s)]);

State.state =
  <S, A>(f: (s: S) => [A, S]): State<S, A> =>
  (s: S) =>
    Eval.later(() => f(s));

State.Monad = <S>() =>
  MonadDefer.of<$<StateF, [S]>>({
    pure:
      <A>(a: A) =>
      s =>
        Eval.now([a, s]),
    flatMap_: (fa, f) => (s: S) =>
      Eval.defer(() => fa(s).flatMap(([a, s2]) => f(a)(s2))),
  });

// -- HKT

export interface StateF extends TyK<[unknown, unknown]> {
  [$type]: State<TyVar<this, 0>, TyVar<this, 1>>;
}
