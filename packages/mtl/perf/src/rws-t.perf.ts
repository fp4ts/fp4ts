// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, configure, cycle, suite } from 'benny';
import { Eval, EvalF, Kind, pipe, tupled } from '@fp4ts/core';
import { Monad, Identity, IdentityF, Seq } from '@fp4ts/cats';
import { IxRWST, MonadState, MonadWriter, RWST } from '@fp4ts/mtl-core';

function makeTests<F>(
  name: string,
  F: MonadState<F, number> & MonadWriter<F, Seq<number>>,
  size: number,
  runRWS: <X>(fa: Kind<F, [X]>) => [X, number, Seq<number>],
) {
  return [
    add(`[${name}] map (${size})`, () => {
      let fa = F.unit;
      for (let i = 0; i < size; i++) {
        fa = F.map_(fa, _ => undefined as void);
      }
      runRWS(fa);
    }),

    add(`[${name}] flatMap (${size})`, () => {
      const go = (i: number): Kind<F, [number]> =>
        i >= size ? F.pure(i) : F.flatMap_(F.pure(i + 1), go);
      runRWS(go(0));
    }),

    add(`[${name}] listen, tell, get, set + flatMap (${size})`, () => {
      const go: Kind<F, [void]> = pipe(
        F.tell(Seq(1)),
        F.productR(F.get),
        F.flatMap(i =>
          i >= size ? F.unit : F.flatMap_(F.set(i + 1), () => go),
        ),
      );
      runRWS(go);
    }),
  ];
}

function makeSuite<F>(
  name: string,
  F: MonadState<F, number> & MonadWriter<F, Seq<number>>,
  runRWS: <X>(fa: Kind<F, [X]>) => [X, number, Seq<number>],
) {
  return [100].flatMap(size => makeTests(name, F, size, runRWS));
}

suite(
  'RWST',
  ...makeSuite(
    'IxRWST<unknown, number, number, Identity, *>',
    {
      ...IxRWST.MonadState<unknown, Seq<number>, number, IdentityF>(
        Seq.Alternative.algebra<number>(),
        Identity.Monad,
      ),
      ...IxRWST.MonadWriter<unknown, Seq<number>, number, IdentityF>(
        Seq.Alternative.algebra<number>(),
        Identity.Monad,
      ),
    },
    sfa => sfa(null, 0),
  ),
  ...makeSuite(
    'RWST<unknown, number, number, Identity, *>',
    {
      ...RWST.MonadState<unknown, Seq<number>, number, IdentityF>(
        Identity.Monad,
      ),
      ...RWST.MonadWriter<unknown, Seq<number>, number, IdentityF>(
        Identity.Monad,
        Seq.Alternative.algebra<number>(),
      ),
    },
    sfa => sfa(tupled)(null, 0, Seq.empty),
  ),
  ...makeSuite(
    'IxRWST<unknown, number, number, Eval, *>',
    {
      ...IxRWST.MonadState<unknown, Seq<number>, number, EvalF>(
        Seq.Alternative.algebra<number>(),
        Monad.Eval,
      ),
      ...IxRWST.MonadWriter<unknown, Seq<number>, number, EvalF>(
        Seq.Alternative.algebra<number>(),
        Monad.Eval,
      ),
    },
    sfa => sfa(null, 0).value,
  ),
  ...makeSuite(
    'RWST<unknown, number, number, Eval, *>',
    {
      ...RWST.MonadState<unknown, Seq<number>, number, EvalF>(Monad.Eval),
      ...RWST.MonadWriter<unknown, Seq<number>, number, EvalF>(
        Monad.Eval,
        Seq.Alternative.algebra<number>(),
      ),
    },
    sfa =>
      sfa((a, s, w) => Eval.now(tupled(a, s, w)))(null, 0, Seq.empty).value,
  ),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
