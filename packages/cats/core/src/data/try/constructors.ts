import { Option } from '../option';
import { Either } from '../either';

import { Failure, Success, Try } from './algebra';

export const success = <A>(a: A): Try<A> => new Success(a);

export const failure = (e: Error): Try<never> => new Failure(e);

export const of = <A>(thunk: () => A): Try<A> => {
  try {
    return success(thunk());
  } catch (e) {
    return failure(e instanceof Error ? e : new Error(`${e}`));
  }
};

export const fromOption = <A>(o: Option<A>): Try<A> =>
  o.fold(() => failure(new Error('Option.empty')), success);

export const fromEither = <A>(ea: Either<Error, A>): Try<A> =>
  ea.fold(failure, success);
