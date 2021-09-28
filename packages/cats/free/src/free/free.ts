import { $, AnyK, Kind, TyK, _ } from '@cats4ts/core';
import { Monad } from '@cats4ts/cats-core';

import { Free as FreeBase } from './algebra';
import { pure, suspend } from './constructors';
import { freeMonad } from './instances';

export type Free<F extends AnyK, A> = FreeBase<F, A>;

export const Free: FreeObj = function <F extends AnyK, A>(a: A): Free<F, A> {
  return pure(a);
};

interface FreeObj {
  <F extends AnyK, A>(a: A): Free<F, A>;
  pure<F extends AnyK, A>(a: A): Free<F, A>;
  suspend<F extends AnyK, A>(a: Kind<F, [A]>): Free<F, A>;

  Monad<F extends AnyK>(): Monad<$<FreeK, [F]>>;
}

Free.pure = pure;
Free.suspend = suspend;
Free.Monad = freeMonad;

// HKT

export const FreeURI = 'free/free-monad';
export type FreeURI = typeof FreeURI;
export type FreeK = TyK<FreeURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [FreeURI]: Tys[0] extends AnyK ? Free<Tys[0], Tys[1]> : any;
  }
}
