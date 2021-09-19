import { Either, Left, Right } from './algebra';

export const right = <A>(a: A): Either<never, A> => new Right(a);

export const pure: <A, E = never>(a: A) => Either<E, A> = right;

export const left = <E>(e: E): Either<E, never> => new Left(e);

export const rightUnit: Either<never, void> = pure(undefined);
