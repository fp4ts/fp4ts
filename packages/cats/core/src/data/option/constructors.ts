import { Either } from '../either';
import { None, Option, Some } from './algebra';

export const some = <A>(a: A): Option<A> => new Some(a);

export const pure = some;

export const none: Option<never> = None;

export const fromEither = <A>(ea: Either<unknown, A>): Option<A> =>
  ea.fold(() => none, some);

export const fromNullable = <A>(x?: A | null | undefined): Option<A> =>
  x != null ? some(x) : none;
