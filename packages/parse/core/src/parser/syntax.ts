// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { isTypeClassInstance, Kind, Lazy } from '@fp4ts/core';
import { Either, EvalF, List, Monad, Option } from '@fp4ts/cats';

import { ParseError } from '../parse-error';
import { Source } from '../source';
import { Stream } from '../stream';
import { StringSource } from '../string-source';
import { TokenType } from '../token-type';

import { ParserT } from './algebra';
import { Consumed } from '../consumed';
import { ParseResult } from './parse-result';
import {
  ap_,
  as_,
  between_,
  chainLeft1_,
  chainLeft_,
  chainRight1_,
  chainRight_,
  collect_,
  debug_,
  filter_,
  flatMap_,
  map2_,
  mapAccumulate_,
  map_,
  orElse_,
  parse,
  parseF,
  parseSource,
  parseSourceF,
  parseStream,
  parseStreamF,
  productL_,
  productR_,
  product_,
  rep1_,
  rep_,
  sepBy1_,
  sepBy_,
  skipRep_,
  surroundedBy_,
} from './operators';

declare module './algebra' {
  interface ParserT<S, M, A> {
    filter(f: (a: A) => boolean): ParserT<S, M, A>;
    collect<B>(f: (a: A) => Option<B>): ParserT<S, M, B>;

    map<B>(f: (a: A) => B): ParserT<S, M, B>;
    as<B>(b: B): ParserT<S, M, B>;

    orElse<B>(
      this: ParserT<S, M, B>,
      that: Lazy<ParserT<S, M, B>>,
    ): ParserT<S, M, B>;
    '<|>'<B>(
      this: ParserT<S, M, B>,
      that: Lazy<ParserT<S, M, B>>,
    ): ParserT<S, M, B>;

    ap<B, C>(
      this: ParserT<S, M, B>,
      that: ParserT<S, M, (b: B) => C>,
    ): ParserT<S, M, C>;
    '<*>'<B, C>(
      this: ParserT<S, M, B>,
      that: ParserT<S, M, (b: B) => C>,
    ): ParserT<S, M, C>;

    map2<B, C>(that: ParserT<S, M, B>, f: (a: A, b: B) => C): ParserT<S, M, C>;

    product<B>(that: ParserT<S, M, B>): ParserT<S, M, [A, B]>;
    productL<B>(that: ParserT<S, M, B>): ParserT<S, M, A>;
    '<*'<B>(that: ParserT<S, M, B>): ParserT<S, M, A>;
    productR<B>(that: ParserT<S, M, B>): ParserT<S, M, B>;
    '*>'<B>(that: ParserT<S, M, B>): ParserT<S, M, B>;

    flatMap<B>(f: (a: A) => ParserT<S, M, B>): ParserT<S, M, B>;

    mapAccumulate<B>(z: B, f: (b: B, a: A) => B): ParserT<S, M, B>;

    skipRep(): ParserT<S, M, void>;

    rep(): ParserT<S, M, List<A>>;
    rep1(): ParserT<S, M, List<A>>;

    sepBy(tok: ParserT<S, M, TokenType<S>>): ParserT<S, M, List<A>>;
    sepBy1(tok: ParserT<S, M, TokenType<S>>): ParserT<S, M, List<A>>;

    chainLeft<B>(
      this: ParserT<S, M, B>,
      z: B,
      op: ParserT<S, M, (x: B, y: B) => B>,
    ): ParserT<S, M, B>;
    chainLeft1<B>(
      this: ParserT<S, M, B>,
      op: ParserT<S, M, (x: B, y: B) => B>,
    ): ParserT<S, M, B>;

    chainRight<B>(
      this: ParserT<S, M, B>,
      z: B,
      op: ParserT<S, M, (x: B, y: B) => B>,
    ): ParserT<S, M, B>;
    chainRight1<B>(
      this: ParserT<S, M, B>,
      op: ParserT<S, M, (x: B, y: B) => B>,
    ): ParserT<S, M, B>;

    between(l: ParserT<S, M, any>, r: ParserT<S, M, any>): ParserT<S, M, A>;
    surroundedBy(that: ParserT<S, M, any>): ParserT<S, M, A>;

    // Parsing functions

    parse(
      this: ParserT<StringSource, EvalF, A>,
      input: string,
    ): Either<ParseError, A>;
    parse(
      this: ParserT<StringSource, EvalF, A>,
      M: Monad<M>,
    ): (input: string) => Either<ParseError, A>;

    parseSource<SS extends Source<any, any>>(
      this: ParserT<SS, EvalF, A>,
      s: SS,
    ): Either<ParseError, A>;
    parseSource<SS extends Source<any, any>>(
      this: ParserT<SS, M, A>,
      M: Monad<M>,
    ): (s: SS) => Kind<M, [Either<ParseError, A>]>;

    parseStream(
      this: ParserT<S, EvalF, A>,
      S: Stream<S, EvalF>,
    ): Either<ParseError, A>;
    parseStream(
      S: Stream<S, M>,
      M: Monad<M>,
    ): (s: S) => Kind<M, [Either<ParseError, A>]>;

    parseConsumedF(
      S: Stream<S, M>,
      M: Monad<M>,
    ): (s: S) => Kind<M, [Consumed<Kind<M, [ParseResult<S, A>]>>]>;

    debug(name: string): ParserT<S, M, A>;
  }
}

ParserT.prototype.filter = function (f) {
  return filter_(this, f);
};
ParserT.prototype.collect = function (f) {
  return collect_(this, f);
};

ParserT.prototype.map = function (f) {
  return map_(this, f);
};
ParserT.prototype.as = function (b) {
  return as_(this, b);
};
ParserT.prototype.orElse = function (that) {
  return orElse_(this, that);
};
ParserT.prototype['<|>'] = ParserT.prototype.orElse;

ParserT.prototype.ap = function (ff) {
  return ap_(ff, this);
};
ParserT.prototype.map2 = function (that, f) {
  return map2_(this, that)(f);
};
ParserT.prototype.product = function (that) {
  return product_(this, that);
};
ParserT.prototype.productL = function (that) {
  return productL_(this, that);
};
ParserT.prototype['<*'] = ParserT.prototype.productL;
ParserT.prototype.productR = function (that) {
  return productR_(this, that);
};
ParserT.prototype['*>'] = ParserT.prototype.productR;

ParserT.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

ParserT.prototype.mapAccumulate = function (z, f) {
  return mapAccumulate_(this, z, f);
};
ParserT.prototype.skipRep = function () {
  return skipRep_(this);
};
ParserT.prototype.rep = function () {
  return rep_(this);
};
ParserT.prototype.rep1 = function () {
  return rep1_(this);
};

ParserT.prototype.sepBy = function (tok) {
  return sepBy_(this, tok);
};
ParserT.prototype.sepBy1 = function (tok) {
  return sepBy1_(this, tok);
};

ParserT.prototype.chainLeft = function (z, op) {
  return chainLeft_(this, z, op);
};
ParserT.prototype.chainLeft1 = function (op) {
  return chainLeft1_(this, op);
};
ParserT.prototype.chainRight = function (z, op) {
  return chainRight_(this, z, op);
};
ParserT.prototype.chainRight1 = function (op) {
  return chainRight1_(this, op);
};

ParserT.prototype.between = function (l, r) {
  return between_(this, l, r);
};
ParserT.prototype.surroundedBy = function (that) {
  return surroundedBy_(this, that);
};

ParserT.prototype.parse = function (this: any, M: any) {
  return typeof M === 'string'
    ? parse(this, M)
    : (s: any) => parseF(M)(this, s);
} as any;

ParserT.prototype.parseSource = function (this: any, M: any) {
  return isTypeClassInstance(M)
    ? (s: any) => parseSourceF(M as any)(this, s)
    : parseSource(this, M);
} as any;

ParserT.prototype.parseStream = function (this: any, ...args: any[]) {
  return args.length === 1
    ? (s: any) => parseStream(args[0])(this, s)
    : (s: any) => parseStreamF(args[0], args[1])(this, s);
} as any;

ParserT.prototype.debug = function (name) {
  return debug_(this, name);
};
