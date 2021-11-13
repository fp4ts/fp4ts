import { Kind } from '@fp4ts/core';
import { FunctionK } from '../../arrow';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Option } from '../option';

import { OptionT } from './algebra';
import {
  flatMapF_,
  flatMap_,
  flatten,
  foldF_,
  fold_,
  getOrElseF_,
  getOrElse_,
  isEmpty,
  mapK_,
  map_,
  nonEmpty,
  orElseF_,
  orElse_,
} from './operators';

declare module './algebra' {
  interface OptionT<F, A> {
    isEmpty(F: Functor<F>): Kind<F, [boolean]>;
    nonEmpty(F: Functor<F>): Kind<F, [boolean]>;

    map<B>(
      this: OptionT<F, B>,
      F: Functor<F>,
    ): <C>(f: (a: B) => C) => OptionT<F, C>;

    orElse<B, C extends B>(
      this: OptionT<F, C>,
      F: Monad<F>,
    ): (that: () => OptionT<F, B>) => OptionT<F, B>;

    orElseF<B, C extends B>(
      this: OptionT<F, C>,
      F: Monad<F>,
    ): (that: () => Kind<F, [Option<B>]>) => OptionT<F, B>;

    getOrElse<B, C extends B>(
      this: OptionT<F, C>,
      F: Monad<F>,
    ): (that: () => B) => Kind<F, [B]>;

    getOrElseF<B, C extends B>(
      this: OptionT<F, C>,
      F: Monad<F>,
    ): (that: () => Kind<F, [B]>) => Kind<F, [B]>;

    flatMap<B>(
      this: OptionT<F, B>,
      F: Monad<F>,
    ): <C>(f: (a: B) => OptionT<F, C>) => OptionT<F, C>;

    flatMapF<B>(
      this: OptionT<F, B>,
      F: Monad<F>,
    ): <C>(f: (a: B) => Kind<F, [C]>) => OptionT<F, C>;

    flatten: A extends OptionT<F, infer B>
      ? (F: Monad<F>) => OptionT<F, B>
      : never | unknown;

    fold<B>(
      this: OptionT<F, B>,
      F: Monad<F>,
    ): <C>(onNone: () => C, onSome: (a: B) => C) => Kind<F, [C]>;

    foldF<B>(
      this: OptionT<F, B>,
      F: Monad<F>,
    ): <C>(
      onNone: () => Kind<F, [C]>,
      onSome: (a: B) => Kind<F, [C]>,
    ) => Kind<F, [C]>;

    mapK<G>(nt: FunctionK<F, G>): OptionT<G, A>;
  }
}

OptionT.prototype.isEmpty = function (F) {
  return isEmpty(F)(this);
};

OptionT.prototype.nonEmpty = function (F) {
  return nonEmpty(F)(this);
};

OptionT.prototype.map = function (F) {
  return f => map_(F)(this, f);
};

OptionT.prototype.orElse = function (F) {
  return that => orElse_(F)(this, that);
};

OptionT.prototype.orElseF = function (F) {
  return that => orElseF_(F)(this, that);
};

OptionT.prototype.getOrElse = function (F) {
  return that => getOrElse_(F)(this, that);
};

OptionT.prototype.getOrElseF = function (F) {
  return that => getOrElseF_(F)(this, that);
};

OptionT.prototype.flatMap = function (F) {
  return f => flatMap_(F)(this, f);
};

OptionT.prototype.flatMapF = function (F) {
  return f => flatMapF_(F)(this, f);
};

OptionT.prototype.flatten = function <F, A>(
  this: OptionT<F, OptionT<F, A>>,
  F: Monad<F>,
) {
  return flatten(F)(this);
};

OptionT.prototype.fold = function (F) {
  return (onNone, onSome) => fold_(F)(this, onNone, onSome);
};

OptionT.prototype.foldF = function (F) {
  return (onNone, onSome) => foldF_(F)(this, onNone, onSome);
};

OptionT.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};
