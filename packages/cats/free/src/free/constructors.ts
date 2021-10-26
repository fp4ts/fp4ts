import { Kind } from '@fp4ts/core';
import { Free, Pure, Suspend } from './algebra';

export const pure = <F, A>(a: A): Free<F, A> => new Pure(a);

export const suspend = <F, A>(fa: Kind<F, [A]>): Free<F, A> => new Suspend(fa);
