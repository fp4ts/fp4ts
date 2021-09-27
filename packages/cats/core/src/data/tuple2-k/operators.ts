import { AnyK } from '@cats4ts/core';
import { FunctionK } from '../../function-k';
import { Tuple2K } from './algebra';

export const swapped = <F extends AnyK, G extends AnyK, A>(
  fa: Tuple2K<F, G, A>,
): Tuple2K<G, F, A> => new Tuple2K(fa.snd, fa.fst);

export const mapK: <G extends AnyK, H extends AnyK, A>(
  nt: FunctionK<G, H>,
) => <F extends AnyK>(fa: Tuple2K<F, G, A>) => Tuple2K<F, H, A> = nt => fa =>
  mapK_(fa, nt);

// -- point-ful operators

export const mapK_ = <F extends AnyK, G extends AnyK, H extends AnyK, A>(
  fa: Tuple2K<F, G, A>,
  nt: FunctionK<G, H>,
): Tuple2K<F, H, A> => new Tuple2K(fa.fst, nt(fa.snd));
