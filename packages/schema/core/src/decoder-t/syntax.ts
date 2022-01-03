// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor, Monad, Option } from '@fp4ts/cats';

import { DecoderT } from './algebra';
import { DecodeFailure } from '../decode-failure';
import {
  adaptF_,
  adapt_,
  andThen_,
  bimap_,
  collect_,
  compose_,
  dimap_,
  filter_,
  flatMap_,
  flatten,
  intersection_,
  leftMap_,
  map_,
  maxExclusive_,
  maxLength_,
  max_,
  minExclusive_,
  minLength_,
  min_,
  nonEmpty,
  orElse_,
  refine_,
  union_,
} from './operators';

declare module './algebra' {
  interface DecoderT<F, I, A> {
    orElse<II extends I, AA>(
      this: DecoderT<F, II, A>,
      F: Monad<F>,
    ): (that: () => DecoderT<F, II, AA>) => DecoderT<F, II, AA>;
    '<|>'<II extends I, AA>(
      this: DecoderT<F, II, A>,
      F: Monad<F>,
    ): (that: () => DecoderT<F, II, AA>) => DecoderT<F, II, AA>;

    filter(
      F: Monad<F>,
    ): (f: (a: A) => boolean, cause?: string) => DecoderT<F, I, A>;
    collect(
      F: Monad<F>,
    ): <B>(f: (a: A) => Option<B>, cause?: string) => DecoderT<F, I, B>;

    dimap(
      F: Functor<F>,
    ): <II, B>(f: (ii: II) => I, g: (a: A) => B) => DecoderT<F, II, B>;
    adapt<II>(f: (ii: II) => I): DecoderT<F, II, A>;
    adaptF(
      F: Monad<F>,
    ): <II>(f: (ii: II) => Kind<F, [I]>) => DecoderT<F, II, A>;

    bimap(
      F: Functor<F>,
    ): <B>(
      f: (df: DecodeFailure) => DecodeFailure,
      g: (a: A) => B,
    ) => DecoderT<F, I, B>;
    leftMap(
      F: Functor<F>,
    ): (f: (df: DecodeFailure) => DecodeFailure) => DecoderT<F, I, A>;
    map(F: Functor<F>): <B>(g: (a: A) => B) => DecoderT<F, I, B>;

    flatMap(
      F: Monad<F>,
    ): <I2 extends I, B>(f: (a: A) => DecoderT<F, I2, B>) => DecoderT<F, I2, B>;
    flatten<B>(
      this: DecoderT<F, I, DecoderT<F, I, B>>,
      F: Monad<F>,
    ): DecoderT<F, I, B>;

    andThen<AA>(
      this: DecoderT<F, I, AA>,
      F: Monad<F>,
    ): <B>(that: DecoderT<F, AA, B>) => DecoderT<F, I, B>;

    compose<II, AA extends II, BB extends AA>(
      this: DecoderT<F, AA, BB>,
      F: Monad<F>,
    ): (that: DecoderT<F, II, AA>) => DecoderT<F, II, BB>;

    refine<AA>(
      this: DecoderT<F, I, AA>,
      F: Monad<F>,
    ): <B extends AA>(
      r: (x: AA) => x is B,
      cause?: string,
    ) => DecoderT<F, I, B>;

    intersection(
      F: Monad<F>,
    ): <B>(that: DecoderT<F, I, B>) => DecoderT<F, I, A & B>;
    '<&>'(F: Monad<F>): <B>(that: DecoderT<F, I, B>) => DecoderT<F, I, A & B>;

    union(F: Monad<F>): <B>(that: DecoderT<F, I, B>) => DecoderT<F, I, A | B>;

    nonEmpty(this: DecoderT<F, I, string>, F: Monad<F>): DecoderT<F, I, string>;
    nonEmpty<B>(this: DecoderT<F, I, B[]>, F: Monad<F>): DecoderT<F, I, B[]>;

    min(
      this: DecoderT<F, I, number>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, number>;
    minExclusive(
      this: DecoderT<F, I, number>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, number>;
    max(
      this: DecoderT<F, I, number>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, number>;
    maxExclusive(
      this: DecoderT<F, I, number>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, number>;

    minLength(
      this: DecoderT<F, I, string>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, string>;
    minLength<B>(
      this: DecoderT<F, I, B[]>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, B[]>;

    maxLength(
      this: DecoderT<F, I, string>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, string>;
    maxLength<B>(
      this: DecoderT<F, I, B[]>,
      F: Monad<F>,
    ): (n: number) => DecoderT<F, I, B[]>;
  }
}

DecoderT.prototype.orElse = function (F) {
  return that => orElse_(F)(this, that);
};
DecoderT.prototype['<|>'] = DecoderT.prototype.orElse;

DecoderT.prototype.filter = function (F) {
  return (f, cause) => filter_(F)(this, f, cause);
};
DecoderT.prototype.collect = function (F) {
  return (f, cause) => collect_(F)(this, f, cause);
};

DecoderT.prototype.dimap = function (F) {
  return (f, g) => dimap_(F)(this, f, g);
};
DecoderT.prototype.adapt = function (f) {
  return adapt_(this, f);
};
DecoderT.prototype.adaptF = function (F) {
  return f => adaptF_(F)(this, f);
};

DecoderT.prototype.bimap = function (F) {
  return (f, g) => bimap_(F)(this, f, g);
};
DecoderT.prototype.leftMap = function (F) {
  return f => leftMap_(F)(this, f);
};
DecoderT.prototype.map = function (F) {
  return f => map_(F)(this, f);
};
DecoderT.prototype.flatMap = function (F) {
  return f => flatMap_(F)(this, f);
};
DecoderT.prototype.flatten = function (F) {
  return flatten(F)(this);
};

DecoderT.prototype.andThen = function (F) {
  return that => andThen_(F)(this, that);
};
DecoderT.prototype.compose = function (F) {
  return that => compose_(F)(this, that);
};

DecoderT.prototype.refine = function (F) {
  return r => refine_(F)(this, r);
};
DecoderT.prototype.intersection = function (F) {
  return that => intersection_(F)(this, that);
};
DecoderT.prototype.union = function (F) {
  return that => union_(F)(this, that);
};

DecoderT.prototype.nonEmpty = function (this: any, F: Monad<any>) {
  return nonEmpty(F)(this) as any;
};
DecoderT.prototype.min = function (F) {
  return n => min_(F)(this, n);
};
DecoderT.prototype.minExclusive = function (F) {
  return n => minExclusive_(F)(this, n);
};
DecoderT.prototype.max = function (F) {
  return n => max_(F)(this, n);
};
DecoderT.prototype.maxExclusive = function (F) {
  return n => maxExclusive_(F)(this, n);
};

DecoderT.prototype.minLength = function (this: any, F: Monad<any>) {
  return (n: number): any => minLength_(F)(this, n);
};
DecoderT.prototype.maxLength = function (this: any, F: Monad<any>) {
  return (n: number): any => maxLength_(F)(this, n);
};
