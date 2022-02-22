// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { isTypeClassInstance, Kind, Lazy } from '@fp4ts/core';
import { Either, EvalF, List, Monad } from '@fp4ts/cats';

import { ParseError } from '../parse-error';
import { Source } from '../source';
import { Stream } from '../stream';
import { StringSource } from '../string-source';
import { TokenType } from '../token-type';

import { ParserT } from './algebra';
import { Consumed } from './consumed';
import { ParseResult } from './parse-result';
import {
  ap_,
  flatMap_,
  map2_,
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
} from './operators';

declare module './algebra' {
  interface ParserT<S, M, A> {
    map<B>(f: (a: A) => B): ParserT<S, M, B>;

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

    rep(): ParserT<S, M, List<A>>;
    rep1(): ParserT<S, M, List<A>>;

    sepBy(tok: ParserT<S, M, TokenType<S>>): ParserT<S, M, List<A>>;
    sepBy1(tok: ParserT<S, M, TokenType<S>>): ParserT<S, M, List<A>>;

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
  }
}

ParserT.prototype.map = function (f) {
  return map_(this, f);
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
