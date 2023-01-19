// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FunctionK } from '../../arrow';
import { Tuple2K } from './tuple2-k';

export const swapped = <F, G, A>([fst, snd]: Tuple2K<F, G, A>): Tuple2K<
  G,
  F,
  A
> => [snd, fst];

export const mapK: <G, H, A>(
  nt: FunctionK<G, H>,
) => <F>(fa: Tuple2K<F, G, A>) => Tuple2K<F, H, A> = nt => fa => mapK_(fa, nt);

// -- point-ful operators

export const mapK_ = <F, G, H, A>(
  [fst, snd]: Tuple2K<F, G, A>,
  nt: FunctionK<G, H>,
): Tuple2K<F, H, A> => [fst, nt(snd)];
