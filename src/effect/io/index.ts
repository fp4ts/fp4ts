import * as Ref from '../ref';
import * as D from '../deferred';

import './syntax';
import { IO as IOBase } from './algebra';
import { delay } from './constructors';

// Public exports

interface IOObj {
  <A>(thunk: () => A): IO<A>;
}

export const IO: IOObj = thunk => delay(thunk);

export type IO<A> = IOBase<A>;

export * from './constructors';
export * from './operators';
export * from './do';

export const deferred: <A>(a?: A) => IO<D.Deferred<A>> = D.of;

export const ref: <A>(a: A) => IO<Ref.Ref<A>> = Ref.of;
