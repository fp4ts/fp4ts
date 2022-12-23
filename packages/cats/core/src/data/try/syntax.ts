// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval } from '@fp4ts/core';
import { Option } from '../option';
import { Either } from '../either';

import { Try } from './algebra';
import {
  collect_,
  flatMap_,
  flatten,
  fold_,
  get,
  getOrElse_,
  isFailure,
  isSuccess,
  map_,
  orElseEval_,
  orElse_,
  recoverWith_,
  recover_,
  toEither,
  toOption,
} from './operators';

declare module './algebra' {
  interface Try<out A> {
    readonly isSuccess: boolean;
    readonly isFailure: boolean;

    readonly toOption: Option<A>;
    readonly toEither: Either<Error, A>;

    readonly get: A;
    getOrElse<B>(this: Try<B>, defaultValue: () => B): B;

    map<B>(f: (a: A) => B): Try<B>;

    collect<B>(f: (a: A) => Option<B>): Try<B>;

    orElse<B>(this: Try<B>, that: () => Try<B>): Try<B>;
    '<|>'<B>(this: Try<B>, that: () => Try<B>): Try<B>;
    orElseEval<B>(this: Try<B>, that: Eval<Try<B>>): Eval<Try<B>>;

    flatMap<B>(f: (a: A) => Try<B>): Try<B>;

    readonly flatten: A extends Try<infer B> ? Try<B> : never;

    recover<B>(this: Try<B>, f: (e: Error) => B): Try<B>;
    recoverWith<B>(this: Try<B>, f: (e: Error) => Try<B>): Try<B>;

    fold<B1, B2 = B1>(
      onFailure: (e: Error) => B1,
      onSuccess: (a: A) => B2,
    ): B1 | B2;
  }
}

Object.defineProperty(Try.prototype, 'isSuccess', {
  get<A>(this: Try<A>): boolean {
    return isSuccess(this);
  },
});
Object.defineProperty(Try.prototype, 'isFailure', {
  get<A>(this: Try<A>): boolean {
    return isFailure(this);
  },
});

Object.defineProperty(Try.prototype, 'toOption', {
  get<A>(this: Try<A>): Option<A> {
    return toOption(this);
  },
});
Object.defineProperty(Try.prototype, 'toEither', {
  get<A>(this: Try<A>): Either<Error, A> {
    return toEither(this);
  },
});

Object.defineProperty(Try.prototype, 'get', {
  get<A>(this: Try<A>): A {
    return get(this);
  },
});
Try.prototype.getOrElse = function (defaultValue) {
  return getOrElse_(this, defaultValue);
};

Try.prototype.map = function (f) {
  return map_(this, f);
};

Try.prototype.collect = function (f) {
  return collect_(this, f);
};

Try.prototype.orElse = function (f) {
  return orElse_(this, f);
};
Try.prototype['<|>'] = Try.prototype.orElse;
Try.prototype.orElseEval = function (that) {
  return orElseEval_(this, that);
};

Try.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Try.prototype, 'flatten', {
  get<A>(this: Try<Try<A>>): Try<A> {
    return flatten(this);
  },
});

Try.prototype.recover = function (f) {
  return recover_(this, f);
};

Try.prototype.recoverWith = function (f) {
  return recoverWith_(this, f);
};

Try.prototype.fold = function (onFailure, onSuccess) {
  return fold_(this, onFailure, onSuccess);
};
