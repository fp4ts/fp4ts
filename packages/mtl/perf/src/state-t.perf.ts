// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, configure, cycle, suite } from 'benny';
import { Eval, EvalF, Kind, pipe, tupled } from '@fp4ts/core';
import { Identity, IdentityF, Monad } from '@fp4ts/cats';
import { IxStateT, MonadState, StateT } from '@fp4ts/mtl-core';

function makeTests<F>(
  name: string,
  F: MonadState<F, number>,
  size: number,
  runState: <X>(fa: Kind<F, [X]>) => [X, number],
) {
  return [
    add(`[${name}] map (${size})`, () => {
      let fa = F.unit;
      for (let i = 0; i < size; i++) {
        fa = F.map_(fa, _ => undefined as void);
      }
      runState(fa);
    }),

    add(`[${name}] flatMap (${size})`, () => {
      const go = (i: number): Kind<F, [number]> =>
        i >= size ? F.pure(i) : F.flatMap_(F.pure(i + 1), go);
      runState(go(0));
    }),

    add(`[${name}] get, set  + flatMap (${size})`, () => {
      const go: Kind<F, [void]> = pipe(
        F.get,
        F.flatMap(i =>
          i >= size ? F.unit : F.flatMap_(F.set(i + 1), () => go),
        ),
      );
      runState(go);
    }),
  ];
}

function makeSuite<F>(
  name: string,
  F: MonadState<F, number>,
  runState: <X>(fa: Kind<F, [X]>) => [X, number],
) {
  return [1_000].flatMap(size => makeTests(name, F, size, runState));
}

suite(
  'StateT',
  ...makeSuite(
    'IxStateT<number, number, Identity, *>',
    IxStateT.MonadState<number, IdentityF>(Identity.Monad),
    sfa => sfa(0),
  ),
  ...makeSuite(
    'StateT<number, Identity, *>',
    StateT.MonadState<IdentityF, number>(Identity.Monad),
    sfa => sfa(a => b => tupled(a, b))(0),
  ),
  ...makeSuite(
    'IxStateT<number, number, Eval, *>',
    IxStateT.MonadState<number, EvalF>(Monad.Eval),
    sfa => sfa(0).value,
  ),
  ...makeSuite(
    'StateT<number, Eval, *>',
    StateT.MonadState<EvalF, number>(Monad.Eval),
    sfa => sfa(a => b => Eval.now(tupled(a, b)))(0).value,
  ),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
