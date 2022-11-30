// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, configure, cycle, suite } from 'benny';
import { Kind, pipe, tupled } from '@fp4ts/core';
import { Eval, EvalF } from '@fp4ts/cats-core';
import { Chain, Identity, IdentityF } from '@fp4ts/cats-core/lib/data';
import { IxRWST, MonadState, MonadWriter, RWST } from '@fp4ts/cats-mtl';

function makeTests<F>(
  name: string,
  F: MonadState<F, number> & MonadWriter<F, Chain<number>>,
  size: number,
  runRWS: <X>(fa: Kind<F, [X]>) => [X, number, Chain<number>],
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
        F.tell(Chain(1)),
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
  F: MonadState<F, number> & MonadWriter<F, Chain<number>>,
  runRWS: <X>(fa: Kind<F, [X]>) => [X, number, Chain<number>],
) {
  return [100].flatMap(size => makeTests(name, F, size, runRWS));
}

suite(
  'RWST',
  ...makeSuite(
    'IxRWST<unknown, number, number, Identity, *>',
    {
      ...IxRWST.MonadState<unknown, Chain<number>, number, IdentityF>(
        Chain.MonoidK.algebra<number>(),
        Identity.Monad,
      ),
      ...IxRWST.MonadWriter<unknown, Chain<number>, number, IdentityF>(
        Chain.MonoidK.algebra<number>(),
        Identity.Monad,
      ),
    },
    sfa => sfa(null, 0),
  ),
  ...makeSuite(
    'RWST<unknown, number, number, Identity, *>',
    {
      ...RWST.MonadState<unknown, Chain<number>, number, IdentityF>(
        Identity.Monad,
      ),
      ...RWST.MonadWriter<unknown, Chain<number>, number, IdentityF>(
        Identity.Monad,
        Chain.MonoidK.algebra<number>(),
      ),
    },
    sfa => sfa(tupled)(null, 0, Chain.empty),
  ),
  ...makeSuite(
    'IxRWST<unknown, number, number, Eval, *>',
    {
      ...IxRWST.MonadState<unknown, Chain<number>, number, EvalF>(
        Chain.MonoidK.algebra<number>(),
        Eval.Monad,
      ),
      ...IxRWST.MonadWriter<unknown, Chain<number>, number, EvalF>(
        Chain.MonoidK.algebra<number>(),
        Eval.Monad,
      ),
    },
    sfa => sfa(null, 0).value,
  ),
  ...makeSuite(
    'RWST<unknown, number, number, Eval, *>',
    {
      ...RWST.MonadState<unknown, Chain<number>, number, EvalF>(Eval.Monad),
      ...RWST.MonadWriter<unknown, Chain<number>, number, EvalF>(
        Eval.Monad,
        Chain.MonoidK.algebra<number>(),
      ),
    },
    sfa =>
      sfa((a, s, w) => Eval.now(tupled(a, s, w)))(null, 0, Chain.empty).value,
  ),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
