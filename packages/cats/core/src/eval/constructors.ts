import { Always, Later, Eval, Now, Defer, Memoize } from './algebra';

export const pure = <A>(a: A): Eval<A> => new Now(a);

export const now = <A>(a: A): Eval<A> => new Now(a);

export const unit: Eval<void> = pure(undefined);

export const always = <A>(thunk: () => A): Eval<A> => new Always(thunk);

export const later = <A>(thunk: () => A): Eval<A> => new Later(thunk);

export const delay = later;

export const defer = <A>(thunk: () => Eval<A>): Eval<A> => new Defer(thunk);
