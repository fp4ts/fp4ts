import { AnyK, Kind } from '@cats4ts/core';
import { Functor, Applicative } from '@cats4ts/cats-core';

import { Option, Some, None } from '../option';

import { OptionT } from './algebra';

export const pure =
  <F extends AnyK>(F: Applicative<F>) =>
  <A>(a: A): OptionT<F, A> =>
    new OptionT(F.pure(Some(a)));

export const some =
  <F extends AnyK>(F: Applicative<F>) =>
  <A>(a: A): OptionT<F, A> =>
    new OptionT(F.pure(Some(a)));

export const none = <F extends AnyK>(F: Applicative<F>): OptionT<F, never> =>
  new OptionT(F.pure(None));

export const liftF =
  <F extends AnyK>(F: Functor<F>) =>
  <A>(fa: Kind<F, [A]>): OptionT<F, A> =>
    new OptionT(F.map_(fa, a => Some(a)));

export const fromOption =
  <F extends AnyK>(F: Applicative<F>) =>
  <A>(opt: Option<A>): OptionT<F, A> =>
    new OptionT(F.pure(opt));

export const fromNullable =
  <F extends AnyK>(F: Applicative<F>) =>
  <A>(x: A | null | undefined): OptionT<F, A> =>
    new OptionT(F.pure(Option(x)));
