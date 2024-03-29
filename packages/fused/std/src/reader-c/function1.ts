// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, F1, Kind } from '@fp4ts/core';
import { Function1F, Functor, Monad } from '@fp4ts/cats';
import { ReaderF } from '@fp4ts/fused-core';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';

export function Function1Algebra<R>(): Algebra<
  { reader: $<ReaderF, [R]> },
  $<Function1F, [R]>
> {
  return Algebra.of({
    ...Monad.Function1<R>(),

    eff: <H, G, A>(
      H: Functor<H>,
      hdl: Handler<H, G, $<Function1F, [R]>>,
      { eff }: Eff<{ reader: $<ReaderF, [R]> }, G, A>,
      hu: Kind<H, [void]>,
    ): ((r: R) => Kind<H, [A]>) =>
      eff.foldMap<[$<Function1F, [R]>, H]>(
        () => r => H.map_(hu, () => r),
        (ga, f) => F1.andThen(f, hdl(H.map_(hu, () => ga))),
      ),
  });
}
