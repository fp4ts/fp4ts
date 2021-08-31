import { Either as EitherBase } from './algebra';
import { left, pure, right } from './constructors';

export type Either<E, A> = EitherBase<E, A>;

export const Either: EitherObj = function <A, E = never>(a: A): Either<E, A> {
  return right(a);
};

export interface EitherObj {
  <A, E = never>(a: A): Either<E, A>;
  right: <A, E = never>(a: A) => Either<E, A>;
  pure: <A, E = never>(a: A) => Either<E, A>;
  left: <E, A = never>(e: E) => Either<E, A>;
}

Either.right = right;
Either.left = left;
Either.pure = pure;
