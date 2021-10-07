import { $, TyK, _ } from '@cats4ts/core';
import { Eq } from '../../eq';
import { Option } from '../option';
import { Either } from '../either';
import { Monad } from '../../monad';
import { Semigroup } from '../../semigroup';

import { Ior as IorBase } from './algebra';
import { both, fromEither, fromOptions, left, right } from './constructors';
import { iorEq, iorMonad } from './instances';
import { tailRecM } from './operators';

export type Ior<A, B> = IorBase<A, B>;
export const Ior: IorObj = function () {};

export interface IorObj {
  Left<A>(a: A): Ior<A, never>;
  Right<B>(b: B): Ior<never, B>;
  Both<A, B>(a: A, b: B): Ior<A, B>;
  fromOption<A, B>(left: Option<A>, right: Option<B>): Option<Ior<A, B>>;
  fromEither<A, B>(ea: Either<A, B>): Ior<A, B>;

  tailRecM<AA>(
    S: Semigroup<AA>,
  ): <S>(
    s: S,
  ) => <A extends AA, B>(f: (s: S) => Ior<A, Either<S, B>>) => Ior<AA, B>;

  // -- Instances
  Eq<A, B>(EqA: Eq<A>, EqB: Eq<B>): Eq<Ior<A, B>>;
  Monad<A>(S: Semigroup<A>): Monad<$<IorK, [A]>>;
}

Ior.Left = left;
Ior.Right = right;
Ior.Both = both;
Ior.fromOption = fromOptions;
Ior.fromEither = fromEither;
Ior.tailRecM = tailRecM;

Ior.Eq = iorEq;
Ior.Monad = iorMonad;

// -- HKT

const IorURI = '@cats4ts/cats/core/data/ior';
type IorURI = typeof IorURI;
export type IorK = TyK<IorURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [IorURI]: Ior<Tys[0], Tys[1]>;
  }
}
