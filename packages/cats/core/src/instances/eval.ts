// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { Eval, EvalF, lazy } from '@fp4ts/core';
import { Comonad } from '../comonad';
import { EqK } from '../eq-k';
import { Defer } from '../defer';
import { MonadDefer } from '../monad-defer';
import { Unzip } from '../unzip';
import { Functor } from '../functor';

export const evalEqK: () => EqK<EvalF> = lazy(() =>
  EqK.of({ liftEq: Eq.Eval }),
);

export const evalDefer = lazy(() =>
  Defer.of<EvalF>({ defer: Eval.defer, fix: Eval.fix }),
);

export const evalFunctor: () => Functor<EvalF> = lazy(() =>
  Functor.of({ map_: (fa, f) => fa.map(f) }),
);

export const evalMonadDefer: () => MonadDefer<EvalF> = lazy(() =>
  MonadDefer.of({
    ...evalDefer(),
    delay: Eval.always,
    pure: Eval.pure,
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
    flatten: fa => fa.flatten(),
  }),
);

export const evalUnzip: () => Unzip<EvalF> = lazy(() => {
  const M = evalMonadDefer();
  return Unzip.of({
    ...M,
    zipWith_: M.map2_,
    zip_: M.product_,
    unzipWith_: (fa, f) => fa.unzipWith(f),
    unzip: fab => fab.unzip(),
  });
});

export const evalComonad: () => Comonad<EvalF> = lazy(() =>
  Comonad.of<EvalF>({
    ...evalFunctor(),
    coflatMap_: (fa, f) => Eval.later(() => f(fa)),
    extract: fa => fa.value,
  }),
);
