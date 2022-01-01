import { Base, Kind } from '@fp4ts/core';

export interface Refining<S> extends Base<S> {
  refine<A, B extends A>(sa: Kind<S, [A]>, f: (a: A) => a is B): Kind<S, [B]>;
}
