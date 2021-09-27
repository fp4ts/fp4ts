import { AnyK, Kind } from '@cats4ts/core';
import { Tuple2K } from './algebra';

export const liftK = <F extends AnyK, G extends AnyK, A>(
  fst: Kind<F, [A]>,
  snd: Kind<G, [A]>,
): Tuple2K<F, G, A> => new Tuple2K(fst, snd);
