import { Option } from '../option';
import { Either } from './algebra';
import {
  flatMap_,
  flatTap_,
  flatten,
  fold_,
  isEmpty,
  map_,
  nonEmpty,
  getOrElse_,
  or_,
  swapped,
  tap_,
  toOption,
} from './operators';

declare module './algebra' {
  interface Either<E, A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    map<B>(f: (a: A) => B): Either<E, B>;
    tap(f: (a: A) => unknown): Either<E, A>;

    orElse<E2, A2>(this: Either<E2, A2>, y: Either<E2, A2>): Either<E2, A2>;
    '<|>'<E2, A2>(this: Either<E2, A2>, y: Either<E2, A2>): Either<E2, A2>;

    getOrElse<A2>(this: Either<E, A2>, defaultValue: () => A2): A2;

    flatMap<B, E2>(
      this: Either<E2, A>,
      f: (a: A) => Either<E2, B>,
    ): Either<E2, B>;
    flatTap<E2>(
      this: Either<E2, A>,
      f: (a: A) => Either<E2, unknown>,
    ): Either<E2, A>;

    readonly flatten: A extends Either<E, infer B>
      ? Either<E, B>
      : never | unknown;

    fold<B>(onLeft: (e: E) => B, onRight: (a: A) => B): B;

    readonly swapped: Either<A, E>;
    readonly toOption: Option<A>;
  }
}

Object.defineProperty(Either.prototype, 'isEmpty', {
  get<E, A>(this: Either<E, A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Either.prototype, 'nonEmpty', {
  get<E, A>(this: Either<E, A>): boolean {
    return nonEmpty(this);
  },
});

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

Either.prototype.orElse = function <E, A>(
  this: Either<E, A>,
  that: Either<E, A>,
): Either<E, A> {
  return or_(this, that);
};

Either.prototype['<|>'] = Either.prototype.orElse;

Either.prototype.getOrElse = function <E, A>(
  this: Either<E, A>,
  defaultValue: () => A,
): A {
  return getOrElse_(this, defaultValue);
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

Object.defineProperty(Either.prototype, 'toOption', {
  get<A>(this: Either<unknown, A>): Option<A> {
    return toOption(this);
  },
});
