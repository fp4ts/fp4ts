// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { isTypeClassInstance, Kind, Lazy } from '@fp4ts/core';
import { Either, IdentityF, List, Monad, Option } from '@fp4ts/cats';
import { Source, Stream } from '@fp4ts/parse-kernel';

import { ParseError } from '../parse-error';
import { StringSource } from '../string-source';

import { ParserT } from './algebra';
import { Consumed } from '../consumed';
import { ParseResult } from './parse-result';
import {
  ap_,
  as_,
  backtrack,
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
  repAs_,
  map_,
  not,
  notFollowedBy_,
  optional,
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
  toUnit,
  repAs1_,
  repVoid_,
  repVoid1_,
} from './operators';
import { Accumulator, Accumulator1 } from '../accumulator';

declare module './algebra' {
  interface ParserT<S, F, A> {
    optional(): ParserT<S, F, Option<A>>;

    filter(f: (a: A) => boolean): ParserT<S, F, A>;
    collect<B>(f: (a: A) => Option<B>): ParserT<S, F, B>;

    map<B>(f: (a: A) => B): ParserT<S, F, B>;
    as<B>(b: B): ParserT<S, F, B>;

    readonly void: ParserT<S, F, void>;

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

    not(): ParserT<S, F, void>;
    notFollowedBy<B>(that: ParserT<S, F, B>): ParserT<S, F, B>;

    skipRep(): ParserT<S, F, void>;

    rep(): ParserT<S, F, List<A>>;
    repVoid(): ParserT<S, F, void>;
    repAs<B>(z: B, f: (b: B, a: A) => B): ParserT<S, F, B>;
    repAs<B>(acc: Accumulator<A, B>): ParserT<S, F, B>;

    rep1(): ParserT<S, F, List<A>>;
    repVoid1(): ParserT<S, F, void>;
    repAs1<AA>(
      this: ParserT<S, F, AA>,
      f: (x: AA, b: AA) => AA,
    ): ParserT<S, F, AA>;
    repAs1<B>(acc: Accumulator1<A, B>): ParserT<S, F, B>;

    sepBy(tok: ParserT<S, F, unknown>): ParserT<S, F, List<A>>;
    sepBy1(tok: ParserT<S, F, unknown>): ParserT<S, F, List<A>>;

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

    backtrack(): ParserT<S, F, A>;

    between(l: ParserT<S, F, any>, r: ParserT<S, F, any>): ParserT<S, F, A>;
    surroundedBy(that: ParserT<S, F, any>): ParserT<S, F, A>;

    complete(): ParserT<S, F, A>;

    // Parsing functions

    parse(
      this: ParserT<StringSource, IdentityF, A>,
      input: string,
    ): Either<ParseError, A>;
    parse(
      this: ParserT<StringSource, IdentityF, A>,
      M: Monad<F>,
    ): (input: string) => Either<ParseError, A>;

    parseSource<SS extends Source<any, any>>(
      this: ParserT<SS, IdentityF, A>,
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

ParserT.prototype.optional = function () {
  return optional(this);
};

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
Object.defineProperty(ParserT.prototype, 'void', {
  get() {
    return toUnit(this);
  },
});

ParserT.prototype.orElse = function (that) {
  return orElse_(this, that);
};
ParserT.prototype['<|>'] = ParserT.prototype.orElse;

ParserT.prototype.ap = function (ff) {
  return ap_(ff, this);
};
ParserT.prototype['<*>'] = ParserT.prototype.ap;
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

ParserT.prototype.not = function () {
  return not(this);
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
ParserT.prototype.repVoid = function () {
  return repVoid_(this);
};
ParserT.prototype.repAs = function (this: any, z: any, f?: any) {
  return repAs_(this, z, f);
} as any;
ParserT.prototype.rep1 = function () {
  return rep1_(this);
};
ParserT.prototype.repVoid1 = function () {
  return repVoid1_(this);
};
ParserT.prototype.repAs1 = function (this: any, f: any) {
  return repAs1_(this, f);
} as any;

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

ParserT.prototype.backtrack = function () {
  return backtrack(this);
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
