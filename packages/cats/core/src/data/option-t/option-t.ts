import { $, AnyK, Kind, TyK, _ } from '@cats4ts/core';
import {
  Apply,
  FlatMap,
  Functor,
  MonoidK,
  SemigroupK,
  Monad,
  Applicative,
  Alternative,
} from '@cats4ts/cats-core';

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
import {
  optionTAlternative,
  optionTApplicative,
  optionTApply,
  optionTFlatMap,
  optionTFunctor,
  optionTMonad,
  optionTMonoidK,
  optionTSemigroupK,
} from './instances';

export type OptionT<F extends AnyK, A> = OptionTBase<F, A>;

export const OptionT: OptionTObj = function <F extends AnyK, A>(
  fa: Kind<F, [A]>,
) {
  return new OptionTBase(fa);
};

export const SomeF = some;
export const NoneF = none;

interface OptionTObj {
  <F extends AnyK, A>(fa: Kind<F, [Option<A>]>): OptionT<F, A>;
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

  // -- Instances

  SemigroupK<F extends AnyK>(F: Monad<F>): SemigroupK<$<OptionTK, [F]>>;
  MonoidK<F extends AnyK>(F: Monad<F>): MonoidK<$<OptionTK, [F]>>;
  Functor<F extends AnyK>(F: Functor<F>): Functor<$<OptionTK, [F]>>;
  Apply<F extends AnyK>(F: Monad<F>): Apply<$<OptionTK, [F]>>;
  Applicative<F extends AnyK>(F: Monad<F>): Applicative<$<OptionTK, [F]>>;
  Alternative<F extends AnyK>(F: Monad<F>): Alternative<$<OptionTK, [F]>>;
  FlatMap<F extends AnyK>(F: Monad<F>): FlatMap<$<OptionTK, [F]>>;
  Monad<F extends AnyK>(F: Monad<F>): Monad<$<OptionTK, [F]>>;
}

OptionT.pure = pure;
OptionT.some = some;
OptionT.none = none;
OptionT.liftF = liftF;
OptionT.fromOption = fromOption;
OptionT.fromNullable = fromNullable;
OptionT.tailRecM = tailRecM;

OptionT.SemigroupK = optionTSemigroupK;
OptionT.MonoidK = optionTMonoidK;
OptionT.Functor = optionTFunctor;
OptionT.Apply = optionTApply;
OptionT.Applicative = optionTApplicative;
OptionT.Alternative = optionTAlternative;
OptionT.FlatMap = optionTFlatMap;
OptionT.Monad = optionTMonad;

// -- HKT

export const OptionTURI = 'cats/data/option-t';
export type OptionTURI = typeof OptionTURI;
export type OptionTK = TyK<OptionTURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [OptionTURI]: Tys[0] extends AnyK ? OptionT<Tys[0], Tys[1]> : any;
  }
}
