// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor, Monad } from '@fp4ts/cats';

import { Algebra } from './algebra';
import { Eff } from './eff';
import { Handler } from './handler';

/**
 * Type class for interpreting a particularly tagged effect `E` into a carrier
 * monad `$<C, [F]>`.
 */
export abstract class Carrier<E, C, N extends string> {
  private readonly _E!: E;
  private readonly _C!: C;

  abstract readonly tag: N;

  abstract monad<F>(F: Monad<F>): Monad<Kind<C, [F]>>;

  abstract eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, Kind<C, [F]>>,
    eff: Eff<Record<N, E>, G, A>,
    hu: Kind<H, [void]>,
  ): Kind<Kind<C, [F]>, [Kind<H, [A]>]>;

  abstract other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, Kind<C, [F]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): Kind<Kind<C, [F]>, [Kind<H, [A]>]>;
}
