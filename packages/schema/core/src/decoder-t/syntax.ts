// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { isTypeClassInstance, Kind } from '@fp4ts/core';
import { Applicative, Either, Eval, Functor, Monad, Option } from '@fp4ts/cats';

import { DecoderT } from './algebra';
import { DecodeResultT } from './decode-result-t';
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
  flatMapR_,
  flatMap_,
  flatten,
  handleErrorWithR_,
  handleErrorWith_,
  handleError_,
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
  nullable,
  optional,
  orElse_,
  refine_,
  transformWithR_,
  transformWith_,
  transform_,
  union_,
} from './operators';
import { Decoder } from './decoder-t';
import { DecodeResult } from './decode-result';

declare module './algebra' {
  interface DecoderT<F, I, A> {
    decode(this: Decoder<I, A>, i: I): DecodeResult<A>;

    nullable(this: Decoder<I, A>): Decoder<I | null, A | null>;
    nullable(F: Applicative<F>): DecoderT<F, I | null, A | null>;
    optional(this: Decoder<I, A>): Decoder<Option<I>, Option<A>>;
    optional(F: Applicative<F>): DecoderT<F, Option<I>, Option<A>>;

    orElse<II extends I, AA>(
      this: Decoder<II, A>,
      that: () => Decoder<II, AA>,
    ): Decoder<II, AA>;
    orElse<II extends I, AA>(
      this: DecoderT<F, II, A>,
      F: Monad<F>,
    ): (that: () => DecoderT<F, II, AA>) => DecoderT<F, II, AA>;
    '<|>'<II extends I, AA>(
      this: Decoder<II, A>,
      that: () => Decoder<II, AA>,
    ): Decoder<II, AA>;
    '<|>'<II extends I, AA>(
      this: DecoderT<F, II, A>,
      F: Monad<F>,
    ): (that: () => DecoderT<F, II, AA>) => DecoderT<F, II, AA>;

    filter(
      this: Decoder<I, A>,
      f: (a: A) => boolean,
      cause?: string,
    ): Decoder<I, A>;
    filter(
      F: Monad<F>,
    ): (f: (a: A) => boolean, cause?: string) => DecoderT<F, I, A>;
    collect<B>(
      this: Decoder<I, B>,
      f: (a: A) => Option<B>,
      cause?: string,
    ): Decoder<I, B>;
    collect(
      F: Monad<F>,
    ): <B>(f: (a: A) => Option<B>, cause?: string) => DecoderT<F, I, B>;

    dimap<II, B>(
      this: Decoder<I, A>,
      f: (ii: II) => I,
      g: (a: A) => B,
    ): Decoder<II, B>;
    dimap(
      F: Functor<F>,
    ): <II, B>(f: (ii: II) => I, g: (a: A) => B) => DecoderT<F, II, B>;
    adapt<II>(f: (ii: II) => I): DecoderT<F, II, A>;
    adaptF(
      F: Monad<F>,
    ): <II>(f: (ii: II) => Kind<F, [I]>) => DecoderT<F, II, A>;

    bimap<B>(
      this: Decoder<I, A>,
      f: (df: DecodeFailure) => DecodeFailure,
      g: (a: A) => B,
    ): Decoder<I, B>;
    bimap(
      F: Functor<F>,
    ): <B>(
      f: (df: DecodeFailure) => DecodeFailure,
      g: (a: A) => B,
    ) => DecoderT<F, I, B>;
    leftMap(
      this: Decoder<I, A>,
      f: (df: DecodeFailure) => DecodeFailure,
    ): Decoder<I, A>;
    leftMap(
      F: Functor<F>,
    ): (f: (df: DecodeFailure) => DecodeFailure) => DecoderT<F, I, A>;
    map<B>(this: Decoder<I, A>, g: (a: A) => B): Decoder<I, B>;
    map(F: Functor<F>): <B>(g: (a: A) => B) => DecoderT<F, I, B>;

    flatMap<I2 extends I, B>(
      this: Decoder<I, A>,
      f: (a: A) => Decoder<I2, B>,
    ): Decoder<I2, B>;
    flatMap(
      F: Monad<F>,
    ): <I2 extends I, B>(f: (a: A) => DecoderT<F, I2, B>) => DecoderT<F, I2, B>;
    flatMapR<B>(
      this: Decoder<I, A>,
      f: (a: A) => DecodeResult<B>,
    ): Decoder<I, B>;
    flatMapR(
      F: Monad<F>,
    ): <B>(f: (a: A) => DecodeResultT<F, B>) => DecoderT<F, I, B>;
    flatten<B>(this: Decoder<I, Decoder<I, B>>): Decoder<I, B>;
    flatten<B>(
      this: DecoderT<F, I, DecoderT<F, I, B>>,
      F: Monad<F>,
    ): DecoderT<F, I, B>;

    handleError<AA>(
      this: Decoder<I, AA>,
      h: (e: DecodeFailure) => AA,
    ): Decoder<I, AA>;
    handleError<AA>(
      this: DecoderT<F, I, AA>,
      F: Functor<F>,
    ): (h: (e: DecodeFailure) => AA) => DecoderT<F, I, AA>;
    handleErrorWithR<AA>(
      this: Decoder<I, AA>,
      h: (e: DecodeFailure) => DecodeResult<AA>,
    ): Decoder<I, AA>;
    handleErrorWithR<AA>(
      this: DecoderT<F, I, AA>,
      F: Monad<F>,
    ): (h: (e: DecodeFailure) => DecodeResultT<F, AA>) => DecoderT<F, I, AA>;
    handleErrorWith<AA>(
      this: Decoder<I, AA>,
      h: (e: DecodeFailure) => Decoder<I, AA>,
    ): Decoder<I, AA>;
    handleErrorWith<AA>(
      this: DecoderT<F, I, AA>,
      F: Monad<F>,
    ): (h: (e: DecodeFailure) => DecoderT<F, I, AA>) => DecoderT<F, I, AA>;

    transform<B>(
      this: Decoder<I, A>,
      f: (ea: Either<DecodeFailure, A>) => Either<DecodeFailure, B>,
    ): Decoder<I, B>;
    transform(
      F: Functor<F>,
    ): <B>(
      f: (ea: Either<DecodeFailure, A>) => Either<DecodeFailure, B>,
    ) => DecoderT<F, I, B>;
    transformWithR<B>(
      this: Decoder<I, A>,
      f: (ea: Either<DecodeFailure, A>) => DecodeResult<B>,
    ): Decoder<I, B>;
    transformWithR(
      F: Monad<F>,
    ): <B>(
      f: (ea: Either<DecodeFailure, A>) => DecodeResultT<F, B>,
    ) => DecoderT<F, I, B>;
    transformWith<B>(
      this: Decoder<I, A>,
      f: (ea: Either<DecodeFailure, A>) => Decoder<I, B>,
    ): Decoder<I, B>;
    transformWith(
      F: Monad<F>,
    ): <B>(
      f: (ea: Either<DecodeFailure, A>) => DecoderT<F, I, B>,
    ) => DecoderT<F, I, B>;

    andThen<AA, B>(
      this: Decoder<I, AA>,
      that: DecoderT<F, AA, B>,
    ): Decoder<I, B>;
    andThen<AA>(
      this: DecoderT<F, I, AA>,
      F: Monad<F>,
    ): <B>(that: DecoderT<F, AA, B>) => DecoderT<F, I, B>;

    compose<II, AA extends II, BB extends AA>(
      this: Decoder<AA, BB>,
      that: Decoder<II, AA>,
    ): Decoder<II, BB>;
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

Object.defineProperty(DecoderT.prototype, 'decode', {
  get<I, A>(this: Decoder<I, A>) {
    return (i: I): Either<DecodeFailure, A> => this.decodeT(i).value.value;
  },
});

DecoderT.prototype.nullable = function (this: any, F?: any) {
  return F ? nullable(F) : nullable(Eval.Applicative)(this);
} as any;
DecoderT.prototype.optional = function (this: any, F?: any) {
  return F ? optional(F) : optional(Eval.Applicative)(this);
} as any;

DecoderT.prototype.orElse = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (that: any) => orElse_(F as any)(this, that)
    : orElse_(Eval.Monad)(this, F);
} as any;
DecoderT.prototype['<|>'] = DecoderT.prototype.orElse;

DecoderT.prototype.filter = function (this: any, ...args: any[]) {
  return isTypeClassInstance(args[0])
    ? (f: any, cause: any) => filter_(args[0])(this, f, cause)
    : filter_(Eval.Monad)(this, args[0], args[1]);
} as any;
DecoderT.prototype.collect = function (this: any, ...args: any[]) {
  return isTypeClassInstance(args[0])
    ? (f: any, cause: any) => collect_(args[0])(this, f, cause)
    : collect_(Eval.Monad)(this, args[0], args[1]);
} as any;

DecoderT.prototype.dimap = function (this: any, ...args: any[]) {
  return isTypeClassInstance(args[0])
    ? (f: any, g: any) => dimap_(args[0])(this, f, g)
    : dimap_(Eval.Functor)(this, args[0], args[1]);
} as any;
DecoderT.prototype.adapt = function (f) {
  return adapt_(this, f);
};
DecoderT.prototype.adaptF = function (F) {
  return f => adaptF_(F)(this, f);
};

DecoderT.prototype.bimap = function (this: any, ...args: any[]) {
  return isTypeClassInstance(args[0])
    ? (f: any, g: any) => bimap_(args[0])(this, f, g)
    : bimap_(Eval.Functor)(this, args[0], args[1]);
} as any;
DecoderT.prototype.leftMap = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (f: any) => leftMap_(F as any)(this, f)
    : leftMap_(Eval.Functor)(this, F);
} as any;
DecoderT.prototype.map = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (f: any) => map_(F as any)(this, f)
    : map_(Eval.Functor)(this, F);
} as any;
DecoderT.prototype.flatMap = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (f: any) => flatMap_(F as any)(this, f)
    : flatMap_(Eval.Monad)(this, F);
} as any;
DecoderT.prototype.flatMapR = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (f: any) => flatMapR_(F as any)(this, f)
    : flatMapR_(Eval.Monad)(this, F);
} as any;
DecoderT.prototype.flatten = function (this: any, ...args: any[]) {
  return args.length === 0 ? flatten(Eval.Monad)(this) : flatten(args[0])(this);
} as any;

DecoderT.prototype.handleError = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (h: any) => handleError_(F as any)(this, h)
    : handleError_(Eval.Functor)(this, F);
} as any;
DecoderT.prototype.handleErrorWithR = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (h: any) => handleErrorWithR_(F as any)(this, h)
    : handleErrorWithR_(Eval.Monad)(this, F);
} as any;
DecoderT.prototype.handleErrorWith = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (h: any) => handleErrorWith_(F as any)(this, h)
    : handleErrorWith_(Eval.Monad)(this, F);
} as any;

DecoderT.prototype.transform = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (h: any) => transform_(F as any)(this, h)
    : transform_(Eval.Monad)(this, F);
} as any;
DecoderT.prototype.transformWithR = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (h: any) => transformWithR_(F as any)(this, h)
    : transformWithR_(Eval.Monad)(this, F);
} as any;
DecoderT.prototype.transformWith = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (h: any) => transformWith_(F as any)(this, h)
    : transformWith_(Eval.Monad)(this, F);
} as any;

DecoderT.prototype.andThen = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (that: any) => andThen_(F as any)(this, that)
    : andThen_(Eval.Monad)(this, F);
} as any;
DecoderT.prototype.compose = function (this: any, F: any) {
  return isTypeClassInstance(F)
    ? (that: any) => compose_(F as any)(this, that)
    : compose_(Eval.Monad)(this, F);
} as any;

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
