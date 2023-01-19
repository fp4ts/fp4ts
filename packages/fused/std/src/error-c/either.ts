// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Either, EitherF, Functor, Left } from '@fp4ts/cats';
import { ErrorF } from '@fp4ts/fused-core';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';

/**
 * An Either carrier for the `Error` effect.
 */
export function EitherAlgebra<E>(): Algebra<
  { error: $<ErrorF, [E]> },
  $<EitherF, [E]>
> {
  return Algebra.of<{ error: $<ErrorF, [E]> }, $<EitherF, [E]>>({
    ...Either.Monad<E>(),
    eff: <H, G, A>(
      H: Functor<H>,
      hdl: Handler<H, G, $<EitherF, [E]>>,
      { eff }: Eff<{ error: $<ErrorF, [E]> }, G, A>,
      hu: Kind<H, [void]>,
    ): Either<E, Kind<H, [A]>> =>
      eff.foldMap<[$<EitherF, [E]>, H]>(
        e => Left(e),
        (ga, h) =>
          hdl(H.map_(hu, () => ga)).leftFlatMap(e =>
            hdl(H.map_(hu, () => h(e))),
          ),
      ),
  });
}
