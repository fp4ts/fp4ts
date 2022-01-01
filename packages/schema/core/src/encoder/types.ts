import { Encoder } from './algebra';

export type TypeOf<E> = E extends Encoder<any, infer A> ? A : unknown;

export type OutputOf<E> = E extends Encoder<infer O, any> ? O : never;
