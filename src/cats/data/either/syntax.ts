import { Either } from './algebra';
import {
  flatMap_,
  flatTap_,
  flatten,
  fold_,
  map_,
  swapped,
  tap_,
} from './operators';

declare module './algebra' {
  interface Either<E, A> {
    map: <B>(f: (a: A) => B) => Either<E, B>;
    tap: (f: (a: A) => unknown) => Either<E, A>;
    flatMap: <B, E2 = E>(f: (a: A) => Either<E2, B>) => Either<E2, B>;
    flatTap: <E2 = E>(f: (a: A) => Either<E2, unknown>) => Either<E2, A>;
    flatten: A extends Either<E, infer B> ? Either<E, B> : never | unknown;
    fold: <B>(onLeft: (e: E) => B, onRight: (a: A) => B) => B;
    swapped: Either<A, E>;
  }
}

Either.prototype.map = function <E, A, B>(
  this: Either<E, A>,
  f: (a: A) => B,
): Either<E, B> {
  return map_(this, f);
};

Either.prototype.tap = function <E, A>(
  this: Either<E, A>,
  f: (a: A) => unknown,
): Either<E, A> {
  return tap_(this, f);
};

Either.prototype.flatMap = function <E, A, B>(
  this: Either<E, A>,
  f: (a: A) => Either<E, B>,
): Either<E, B> {
  return flatMap_(this, f);
};

Either.prototype.flatTap = function <E, A>(
  this: Either<E, A>,
  f: (a: A) => Either<E, unknown>,
): Either<E, A> {
  return flatTap_(this, f);
};

Object.defineProperty(Either.prototype, 'flatten', {
  get<E, A>(this: Either<E, Either<E, A>>): Either<E, A> {
    return flatten(this);
  },
});

Either.prototype.fold = function <E, A, B>(
  this: Either<E, A>,
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
): B {
  return fold_(this, onLeft, onRight);
};

Object.defineProperty(Either.prototype, 'swapped', {
  get<E, A>(this: Either<E, A>): Either<A, E> {
    return swapped(this);
  },
});
