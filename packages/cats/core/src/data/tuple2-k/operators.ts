import { AnyK } from '@cats4ts/core';
import { FunctionK } from '../../arrow';
import { Tuple2K } from './tuple2-k';

export const swapped = <F extends AnyK, G extends AnyK, A>([fst, snd]: Tuple2K<
  F,
  G,
  A
>): Tuple2K<G, F, A> => [snd, fst];

export const mapK: <G extends AnyK, H extends AnyK, A>(
  nt: FunctionK<G, H>,
) => <F extends AnyK>(fa: Tuple2K<F, G, A>) => Tuple2K<F, H, A> = nt => fa =>
  mapK_(fa, nt);

// -- point-ful operators

export const mapK_ = <F extends AnyK, G extends AnyK, H extends AnyK, A>(
  [fst, snd]: Tuple2K<F, G, A>,
  nt: FunctionK<G, H>,
): Tuple2K<F, H, A> => [fst, nt(snd)];
