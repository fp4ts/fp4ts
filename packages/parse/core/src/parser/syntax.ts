// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { isTypeClassInstance, Kind, Lazy } from '@fp4ts/core';
import { Either, EvalF, List, Monad, Option } from '@fp4ts/cats';
import { Source, Stream, TokenType } from '@fp4ts/parse-kernel';

import { ParseError } from '../parse-error';
import { StringSource } from '../string-source';

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
  complete_,
  debug_,
  filter_,
  flatMap_,
  label_,
  map2_,
  mapAccumulate_,
  map_,
  notFollowedBy_,
  orElse_,
  parse,
  parseConsumedF,
  parseF,
  parseSource,
  parseSourceF,
  parseStream,
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
  interface ParserT<S, F, A> {
    filter(f: (a: A) => boolean): ParserT<S, F, A>;
    collect<B>(f: (a: A) => Option<B>): ParserT<S, F, B>;

    map<B>(f: (a: A) => B): ParserT<S, F, B>;
    as<B>(b: B): ParserT<S, F, B>;

    orElse<B>(
      this: ParserT<S, F, B>,
      that: Lazy<ParserT<S, F, B>>,
    ): ParserT<S, F, B>;
    '<|>'<B>(
      this: ParserT<S, F, B>,
      that: Lazy<ParserT<S, F, B>>,
    ): ParserT<S, F, B>;

    ap<B, C>(
      this: ParserT<S, F, B>,
      that: ParserT<S, F, (b: B) => C>,
    ): ParserT<S, F, C>;
    '<*>'<B, C>(
      this: ParserT<S, F, B>,
      that: ParserT<S, F, (b: B) => C>,
    ): ParserT<S, F, C>;

    map2<B, C>(that: ParserT<S, F, B>, f: (a: A, b: B) => C): ParserT<S, F, C>;

    product<B>(that: ParserT<S, F, B>): ParserT<S, F, [A, B]>;
    productL<B>(that: ParserT<S, F, B>): ParserT<S, F, A>;
    '<*'<B>(that: ParserT<S, F, B>): ParserT<S, F, A>;
    productR<B>(that: ParserT<S, F, B>): ParserT<S, F, B>;
    '*>'<B>(that: ParserT<S, F, B>): ParserT<S, F, B>;

    flatMap<B>(f: (a: A) => ParserT<S, F, B>): ParserT<S, F, B>;

    mapAccumulate<B>(z: B, f: (b: B, a: A) => B): ParserT<S, F, B>;

    notFollowedBy<B>(that: ParserT<S, F, B>): ParserT<S, F, B>;

    skipRep(): ParserT<S, F, void>;

    rep(): ParserT<S, F, List<A>>;
    rep1(): ParserT<S, F, List<A>>;

    sepBy(tok: ParserT<S, F, TokenType<S>>): ParserT<S, F, List<A>>;
    sepBy1(tok: ParserT<S, F, TokenType<S>>): ParserT<S, F, List<A>>;

    chainLeft<B>(
      this: ParserT<S, F, B>,
      z: B,
      op: ParserT<S, F, (x: B, y: B) => B>,
    ): ParserT<S, F, B>;
    chainLeft1<B>(
      this: ParserT<S, F, B>,
      op: ParserT<S, F, (x: B, y: B) => B>,
    ): ParserT<S, F, B>;

    chainRight<B>(
      this: ParserT<S, F, B>,
      z: B,
      op: ParserT<S, F, (x: B, y: B) => B>,
    ): ParserT<S, F, B>;
    chainRight1<B>(
      this: ParserT<S, F, B>,
      op: ParserT<S, F, (x: B, y: B) => B>,
    ): ParserT<S, F, B>;

    between(l: ParserT<S, F, any>, r: ParserT<S, F, any>): ParserT<S, F, A>;
    surroundedBy(that: ParserT<S, F, any>): ParserT<S, F, A>;

    complete(): ParserT<S, F, A>;

    // Parsing functions

    parse(
      this: ParserT<StringSource, EvalF, A>,
      input: string,
    ): Either<ParseError, A>;
    parse(
      this: ParserT<StringSource, EvalF, A>,
      M: Monad<F>,
    ): (input: string) => Either<ParseError, A>;

    parseSource<SS extends Source<any, any>>(
      this: ParserT<SS, EvalF, A>,
      s: SS,
    ): Either<ParseError, A>;
    parseSource<SS extends Source<any, any>>(
      this: ParserT<SS, F, A>,
      M: Monad<F>,
    ): (s: SS) => Kind<F, [Either<ParseError, A>]>;

    parseStream(S: Stream<S, F>): (s: S) => Kind<F, [Either<ParseError, A>]>;

    parseConsumedF(
      S: Stream<S, F>,
    ): (s: S) => Kind<F, [Consumed<Kind<F, [ParseResult<S, A>]>>]>;

    label(...msgs: string[]): ParserT<S, F, A>;
    '<?>'(...msgs: string[]): ParserT<S, F, A>;

    debug(name: string): ParserT<S, F, A>;
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
ParserT.prototype.notFollowedBy = function (that) {
  return notFollowedBy_(this, that);
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
ParserT.prototype.complete = function () {
  return complete_(this);
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

ParserT.prototype.parseStream = function (S) {
  return s => parseStream(S)(this, s);
};
ParserT.prototype.parseConsumedF = function (S) {
  return s => parseConsumedF(S)(this, s);
};

ParserT.prototype.label = function (...msgs) {
  return label_(this, ...msgs);
};
ParserT.prototype['<?>'] = ParserT.prototype.label;
ParserT.prototype.debug = function (name) {
  return debug_(this, name);
};
