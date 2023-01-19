// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

// import { Option } from '@fp4ts/cats';
import { Guard } from './algebra';
import {
  andThen_,
  compose_,
  intersection_,
  maxExclusive_,
  maxLength_,
  max_,
  minExclusive_,
  minLength_,
  min_,
  nonEmpty,
  optional,
  refine_,
  union_,
} from './operators';

declare module './algebra' {
  interface Guard<I, A extends I> {
    readonly nullable: Guard<I | null, A | null>;
    readonly optional: Guard<I | undefined, A | undefined>;
    refine<B extends A>(refinement: (a: A) => a is B): Guard<I, B>;

    intersection<B extends I>(that: Guard<I, B>): Guard<I, A & B>;
    '<&>'<B extends I>(that: Guard<I, B>): Guard<I, A & B>;

    union<B extends I>(that: Guard<I, B>): Guard<I, A | B>;
    '<|>'<B extends I>(that: Guard<I, B>): Guard<I, A | B>;

    nonEmpty(this: Guard<I | string, string>): Guard<I, A>;
    nonEmpty<B>(this: Guard<I | B[], B[]>): Guard<I, A>;

    min(this: Guard<I | number, number>, n: number): Guard<I, A>;
    minExclusive(this: Guard<I | number, number>, n: number): Guard<I, A>;
    max(this: Guard<I | number, number>, n: number): Guard<I, A>;
    maxExclusive(this: Guard<I | number, number>, n: number): Guard<I, A>;

    minLength(this: Guard<I | string, string>, n: number): Guard<I, A>;
    minLength<B>(this: Guard<I | B[], B[]>, n: number): Guard<I, A>;

    maxLength(this: Guard<I | string, string>, n: number): Guard<I, A>;
    maxLength<B>(this: Guard<I | B[], B[]>, n: number): Guard<I, A>;

    andThen<B extends A>(that: Guard<A, B>): Guard<I, B>;
    compose<II, AA extends II, BB extends AA>(
      this: Guard<AA, BB>,
      that: Guard<II, AA>,
    ): Guard<II, BB>;
  }
}

Object.defineProperty(Guard.prototype, 'optional', {
  get() {
    return optional(this);
  },
});
Guard.prototype.refine = function (r) {
  return refine_(this, r);
};
Guard.prototype.intersection = function (that) {
  return intersection_(this, that);
};
Guard.prototype['<&>'] = Guard.prototype.intersection;

Guard.prototype.union = function (that) {
  return union_(this, that);
};
Guard.prototype['<|>'] = Guard.prototype.union;

Guard.prototype.nonEmpty = function () {
  return nonEmpty(this);
};

Guard.prototype.min = function (n) {
  return min_(this, n);
};
Guard.prototype.minExclusive = function (n) {
  return minExclusive_(this, n);
};

Guard.prototype.max = function (n) {
  return max_(this, n);
};
Guard.prototype.maxExclusive = function (n) {
  return maxExclusive_(this, n);
};

Guard.prototype.minLength = function (n: number) {
  return minLength_(this, n);
};
Guard.prototype.maxLength = function (n: number) {
  return maxLength_(this, n);
};

Guard.prototype.andThen = function (that) {
  return andThen_(this, that);
};

Guard.prototype.compose = function (that) {
  return compose_(this, that);
};
