// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { Eval, EvalF, lazy } from '@fp4ts/core';
import { Comonad } from '../comonad';
import { Defer } from '../defer';
import { EqK } from '../eq-k';
import { StackSafeMonad } from '../stack-safe-monad';
import { Unzip } from '../unzip';

export const evalEqK: () => EqK<EvalF> = lazy(() =>
  EqK.of({ liftEq: Eq.Eval }),
);

export const evalDefer = lazy(() => Defer.of<EvalF>({ defer: Eval.defer }));

export const evalMonad: () => StackSafeMonad<EvalF> = lazy(() =>
  StackSafeMonad.of({
    ...evalDefer(),
    pure: Eval.pure,
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
    flatten: fa => fa.flatten(),
  }),
);

export const evalUnzip: () => Unzip<EvalF> = lazy(() => {
  const M = evalMonad();
  return Unzip.of({
    ...M,
    zipWith_: M.map2_,
    zip_: M.product_,
    unzipWith_: (fa, f) => fa.unzipWith(f),
    unzip: fab => fab.unzip(),
  });
});

export const evalComonad: () => Comonad<EvalF> = lazy(() =>
  Comonad.of({
    ...evalMonad(),
    coflatMap_: (fa, f) => Eval.later(() => f(fa)),
    extract: fa => fa.value,
  }),
);
