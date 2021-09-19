import { Base, Kind, AnyK } from '@cats4ts/core';

export interface Defer<F extends AnyK> extends Base<F> {
  readonly defer: <A>(fa: () => Kind<F, [A]>) => Kind<F, [A]>;
}
