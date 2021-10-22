import { id, Kind } from '@cats4ts/core';

export interface FunctionK<F, G> {
  <A>(fa: Kind<F, [A]>): Kind<G, [A]>;
}
export const FunctionK = Object.freeze({
  id: <F>(): FunctionK<F, F> => id,
});
