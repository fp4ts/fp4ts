import { id } from '@fp4ts/core';
import { Identity } from './identity';

export const pure: <A>(a: A) => Identity<A> = id;
export const unit: Identity<void> = undefined;
