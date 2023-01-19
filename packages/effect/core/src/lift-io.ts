// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherTF, KleisliF, OptionTF, Right, Some } from '@fp4ts/cats';
import { $, id, Kind } from '@fp4ts/core';
import { IO, IOF } from './io';

/**
 * Type class providing lifting of IO effect into the context of `F`
 */
export interface LiftIO<F> {
  liftIO<A>(ioa: IO<A>): Kind<F, [A]>;
}
export function LiftIO<F>(liftIO: <A>(ioa: IO<A>) => Kind<F, [A]>): LiftIO<F> {
  return { liftIO };
}
LiftIO.IO = LiftIO<IOF>(id);
LiftIO.OptionT = LiftIO<$<OptionTF, [IOF]>>(ioa => ioa.map(Some));
LiftIO.EitherT = <E>() => LiftIO<$<EitherTF, [IOF, E]>>(ioa => ioa.map(Right));
LiftIO.Kleisli = <R>() => LiftIO<$<KleisliF, [IOF, R]>>(ioa => _ => ioa);
