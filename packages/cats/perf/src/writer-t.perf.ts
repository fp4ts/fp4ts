// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, configure, cycle, suite } from 'benny';
import { Eval, EvalF, id, Kind, tupled } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Identity, IdentityF } from '@fp4ts/cats-core/lib/data';
import { MonadWriter, WriterT, WriterTChurch } from '@fp4ts/cats-mtl';

function makeTests<F>(
  name: string,
  F: MonadWriter<F, number>,
  size: number,
  runWriter: <X>(fa: Kind<F, [X]>) => [X, number],
) {
  return [
    add(`[${name}] map (${size})`, () => {
      let fa = F.unit;
      for (let i = 0; i < size; i++) {
        fa = F.map_(fa, _ => undefined as void);
      }
      runWriter(fa);
    }),

    add(`[${name}] flatMap (${size})`, () => {
      const go = (i: number): Kind<F, [number]> =>
        i >= size ? F.pure(i) : F.flatMap_(F.pure(i + 1), go);
      runWriter(go(0));
    }),

    add(`[${name}] listen, tell + flatMap (${size})`, () => {
      const go = (i: number): Kind<F, [void]> =>
        F.flatMap_(F.listen(F.tell(1)), () => (i >= size ? F.unit : go(i + 1)));
      runWriter(go(0));
    }),
  ];
}

function makeSuite<F>(
  name: string,
  F: MonadWriter<F, number>,
  runWriter: <X>(fa: Kind<F, [X]>) => [X, number],
) {
  return [1_000].flatMap(size => makeTests(name, F, size, runWriter));
}

suite(
  'WriterT',
  ...makeSuite(
    'WriterT<number, number, Identity, *>',
    WriterT.MonadWriter<IdentityF, number>(Identity.Monad, Monoid.addition),
    id,
  ),
  ...makeSuite(
    'WriterTChurch<Identity, number, *>',
    WriterTChurch.MonadWriter<IdentityF, number>(
      Identity.Monad,
      Monoid.addition,
    ),
    sfa => sfa(a => b => tupled(a, b))(0),
  ),
  ...makeSuite(
    'WriterT<number, number, Eval, *>',
    WriterT.MonadWriter<EvalF, number>(Monad.Eval, Monoid.addition),
    sfa => sfa.value,
  ),
  ...makeSuite(
    'WriterTChurch<number, Eval, *>',
    WriterTChurch.MonadWriter<EvalF, number>(Monad.Eval, Monoid.addition),
    sfa => sfa(a => b => Eval.now(tupled(a, b)))(0).value,
  ),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
