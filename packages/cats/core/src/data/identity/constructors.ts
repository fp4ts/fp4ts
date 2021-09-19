import { Identity } from './algebra';

export const pure: <A>(a: A) => Identity<A> = x => new Identity(x);
export const unit: Identity<void> = pure(undefined);
