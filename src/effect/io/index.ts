import { IO } from './io';
import * as Ref from '../kernel/ref';
import * as D from '../kernel/deferred';

import './syntax';

// Public exports

export { IO } from './io';

export const deferred: <A>(a?: A) => IO<D.Deferred<A>> = D.of;

export const ref: <A>(a: A) => IO<Ref.Ref<A>> = Ref.of;
