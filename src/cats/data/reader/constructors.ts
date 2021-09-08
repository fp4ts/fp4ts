import { Provide, Pure, Read, Reader } from './algebra';

export const pure = <A>(a: A): Reader<unknown, A> => new Pure(a);

export const unit: Reader<unknown, void> = pure(undefined);

export const read = <R>(): Reader<R, R> => new Read();

export const provide = <R>(r: R): Reader<unknown, void> => new Provide(r);
