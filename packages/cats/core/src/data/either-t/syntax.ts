// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { Either } from '../either';
import { Option } from '../option';
import { OptionT } from '../option-t';

import { EitherT } from './algebra';
import {
  bimap_,
  flatMapF_,
  flatMap_,
  flatten,
  foldF_,
  fold_,
  getOrElseF_,
  getOrElse_,
  isLeft,
  isRight,
  leftMap_,
  map_,
  orElseF_,
  orElse_,
  swapped,
} from './operators';

declare module './algebra' {
  interface EitherT<in out F, out A, out B> {
    isLeft(F: Functor<F>): Kind<F, [boolean]>;
    isRight(F: Functor<F>): Kind<F, [boolean]>;

    swapped(F: Functor<F>): EitherT<F, B, A>;

    fold<F>(
      F: Functor<F>,
    ): <C, D = C>(f: (a: A) => C, g: (b: B) => D) => Kind<F, [C | D]>;
    foldF<F>(
      F: FlatMap<F>,
    ): <C, D = C>(
      f: (a: A) => Kind<F, [C]>,
      g: (b: B) => Kind<F, [D]>,
    ) => Kind<F, [C | D]>;

    getOrElse<BB>(
      this: EitherT<F, A, BB>,
      F: Functor<F>,
    ): (defaultValue: () => BB) => Kind<F, [BB]>;
    getOrElseF<BB>(
      this: EitherT<F, A, BB>,
      F: Monad<F>,
    ): (defaultValue: () => Kind<F, [BB]>) => Kind<F, [BB]>;

    orElse<AA, BB>(
      this: EitherT<F, AA, BB>,
      F: Monad<F>,
    ): (alt: () => EitherT<F, AA, BB>) => EitherT<F, AA, BB>;
    '<|>'<AA, BB>(
      this: EitherT<F, AA, BB>,
      F: Monad<F>,
    ): (alt: () => EitherT<F, AA, BB>) => EitherT<F, AA, BB>;
    orElseF<AA, BB>(
      this: EitherT<F, AA, BB>,
      F: Monad<F>,
    ): (alt: () => Kind<F, [Either<AA, BB>]>) => EitherT<F, AA, BB>;

    bimap<F>(
      F: Functor<F>,
    ): <C, D>(f: (a: A) => C, g: (b: B) => D) => EitherT<F, C, D>;
    leftMap<F>(F: Functor<F>): <C>(f: (a: A) => C) => EitherT<F, C, B>;
    map<F>(F: Functor<F>): <D>(g: (b: B) => D) => EitherT<F, A, D>;

    flatMap<F, AA>(
      this: EitherT<F, AA, B>,
      F: Monad<F>,
    ): <D>(f: (b: B) => EitherT<F, AA, D>) => EitherT<F, AA, D>;
    flatMapF<F, AA>(
      this: EitherT<F, AA, B>,
      F: Monad<F>,
    ): <D>(f: (b: B) => Kind<F, [Either<AA, D>]>) => EitherT<F, AA, D>;

    flatten<F, AA, BB>(
      this: EitherT<F, AA, EitherT<F, AA, BB>>,
      F: Monad<F>,
    ): EitherT<F, AA, BB>;

    toOptionF(F: Functor<F>): Kind<F, [Option<B>]>;
    toOptionT(F: Functor<F>): OptionT<F, B>;

    leftWiden<AA>(this: EitherT<F, AA, B>): EitherT<F, AA, B>;
  }
}

EitherT.prototype.isLeft = function (F) {
  return isLeft(F)(this);
};
EitherT.prototype.isRight = function (F) {
  return isRight(F)(this);
};
EitherT.prototype.swapped = function (F) {
  return swapped(F)(this);
};

EitherT.prototype.fold = function (F) {
  return (f, g) => fold_(F)(this, f, g);
};
EitherT.prototype.foldF = function (F) {
  return (f, g) => foldF_(F)(this, f, g);
};

EitherT.prototype.getOrElse = function (F) {
  return defaultValue => getOrElse_(F)(this, defaultValue);
};
EitherT.prototype.getOrElseF = function (F) {
  return defaultValue => getOrElseF_(F)(this, defaultValue);
};

EitherT.prototype.orElse = function (F) {
  return alt => orElse_(F)(this, alt);
};
EitherT.prototype['<|>'] = EitherT.prototype.orElse;
EitherT.prototype.orElseF = function (F) {
  return alt => orElseF_(F)(this, alt);
};

EitherT.prototype.bimap = function (F) {
  return (f, g) => bimap_(F)(this, f, g);
};
EitherT.prototype.leftMap = function (F) {
  return f => leftMap_(F)(this, f);
};
EitherT.prototype.map = function (F) {
  return g => map_(F)(this, g);
};

EitherT.prototype.flatMap = function (F) {
  return f => flatMap_(F)(this, f);
};
EitherT.prototype.flatMapF = function (F) {
  return f => flatMapF_(F)(this, f);
};

EitherT.prototype.flatten = function (F) {
  return flatten(F)(this);
};
EitherT.prototype.leftWiden = function () {
  return this;
};
