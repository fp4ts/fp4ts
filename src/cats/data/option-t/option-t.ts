// HKT

import { AnyK, Kind, TyK, _ } from '../../../core';
import { Monad } from '../../monad';
import { Applicative } from '../../applicative';

import { Option } from '../option';
import { Either } from '../either';

import { OptionT as OptionTBase } from './algebra';
import {
  fromNullable,
  fromOption,
  liftF,
  none,
  pure,
  some,
} from './constructors';
import { tailRecM } from './operators';

export type OptionT<F extends AnyK, A> = OptionTBase<F, A>;

export const OptionT: OptionTObj = function <F extends AnyK>(
  F: Applicative<F>,
) {
  return fromNullable(F);
};

export const SomeF = some;
export const NoneF = none;

interface OptionTObj {
  <F extends AnyK>(F: Applicative<F>): <A>(
    x: A | null | undefined,
  ) => OptionT<F, A>;
  pure: <F extends AnyK>(F: Applicative<F>) => <A>(a: A) => OptionT<F, A>;
  some: <F extends AnyK>(F: Applicative<F>) => <A>(a: A) => OptionT<F, A>;
  none: <F extends AnyK>(F: Applicative<F>) => OptionT<F, never>;
  liftF: <F extends AnyK>(
    F: Applicative<F>,
  ) => <A>(a: Kind<F, [A]>) => OptionT<F, A>;
  fromOption: <F extends AnyK>(
    F: Applicative<F>,
  ) => <A>(a: Option<A>) => OptionT<F, A>;
  fromNullable: <F extends AnyK>(
    F: Applicative<F>,
  ) => <A>(x: A | null | undefined) => OptionT<F, A>;

  tailRecM: <F extends AnyK>(
    F: Monad<F>,
  ) => <A>(a: A) => <B>(f: (a: A) => OptionT<F, Either<A, B>>) => OptionT<F, B>;
}

OptionT.pure = pure;
OptionT.some = some;
OptionT.none = none;
OptionT.liftF = liftF;
OptionT.fromOption = fromOption;
OptionT.fromNullable = fromNullable;
OptionT.tailRecM = tailRecM;

// -- HKT

export const OptionTURI = 'cats/data/option-t';
export type OptionTURI = typeof OptionTURI;
export type OptionTK = TyK<OptionTURI, [_, _]>;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [OptionTURI]: Tys[0] extends AnyK ? OptionT<Tys[0], Tys[1]> : any;
  }
}
