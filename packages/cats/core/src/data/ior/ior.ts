import { $, $type, TyK, TyVar } from '@cats4ts/core';
import { Eq } from '../../eq';
import { Option } from '../option';
import { Either } from '../either';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Semigroup } from '../../semigroup';
import { Bifunctor } from '../../bifunctor';

import { Ior as IorBase } from './algebra';
import { both, fromEither, fromOptions, left, right } from './constructors';
import { iorBifunctor, iorEq, iorMonad, iorMonadError } from './instances';
import { tailRecM } from './operators';

export type Ior<A, B> = IorBase<A, B>;
export const Ior: IorObj = function () {} as any;

export interface IorObj {
  Left<A>(a: A): Ior<A, never>;
  Right<B>(b: B): Ior<never, B>;
  Both<A, B>(a: A, b: B): Ior<A, B>;
  fromOptions<A, B>(left: Option<A>, right: Option<B>): Option<Ior<A, B>>;
  fromEither<A, B>(ea: Either<A, B>): Ior<A, B>;

  tailRecM<AA>(
    S: Semigroup<AA>,
  ): <S>(
    s: S,
  ) => <A extends AA, B>(f: (s: S) => Ior<A, Either<S, B>>) => Ior<AA, B>;

  // -- Instances
  Eq<A, B>(EqA: Eq<A>, EqB: Eq<B>): Eq<Ior<A, B>>;
  readonly Bifunctor: Bifunctor<IorK>;
  Monad<A>(S: Semigroup<A>): Monad<$<IorK, [A]>>;
  MonadError<A>(S: Semigroup<A>): MonadError<$<IorK, [A]>, A>;
}

Ior.Left = left;
Ior.Right = right;
Ior.Both = both;
Ior.fromOptions = fromOptions;
Ior.fromEither = fromEither;
Ior.tailRecM = tailRecM;

Ior.Eq = iorEq;
Ior.Monad = iorMonad;
Ior.MonadError = iorMonadError;
Object.defineProperty(Ior, 'Bifunctor', {
  get(): Bifunctor<IorK> {
    return iorBifunctor();
  },
});

// -- HKT

export interface IorK extends TyK<[unknown, unknown]> {
  [$type]: Ior<TyVar<this, 0>, TyVar<this, 1>>;
}
