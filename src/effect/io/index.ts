import * as Ref from '../ref';
import * as D from '../deferred';
import { IO } from './io';

import './syntax';

// Public exports

export { IO } from './io';

export * from './constructors';
export * from './operators';
export * from './do';

export const deferred: <A>(a?: A) => IO<D.Deferred<A>> = D.of;

export const ref: <A>(a: A) => IO<Ref.Ref<A>> = Ref.of;
