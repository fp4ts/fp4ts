import { Kind } from '@fp4ts/core';
import { Tuple2K } from './tuple2-k';

export const liftK = <F, G, A>(
  fst: Kind<F, [A]>,
  snd: Kind<G, [A]>,
): Tuple2K<F, G, A> => [fst, snd];
