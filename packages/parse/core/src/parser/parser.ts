// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF, Monad, Option } from '@fp4ts/cats';
import { Kind } from '@fp4ts/core';
import { Consumed } from '../consumed';
import { SourcePosition } from '../source-position';
import { TokenType } from '../token-type';
import { ParserT as ParserTBase } from './algebra';
import {
  defer,
  empty,
  fail,
  makeParser,
  makeParserT,
  succeed,
  uncons,
  unconsPrim,
} from './constructors';
import { ParseResult } from './parse-result';
import { State } from './state';

export type ParserT<S, M, A> = ParserTBase<S, M, A>;

export type Parser<S, A> = ParserT<S, EvalF, A>;

export const ParserT: ParserTObj = function (runParserT) {
  return makeParserT(runParserT);
};
export const Parser: ParserObj = function (runParser) {
  return makeParser(runParser);
};

interface ParserTObj {
  <S, M, A>(
    runParserT: (
      M: Monad<M>,
    ) => (s: State<S>) => Kind<M, [Consumed<Kind<M, [ParseResult<S, A>]>>]>,
  ): ParserT<S, M, A>;
  succeed<S, M, A>(x: A): ParserT<S, M, A>;
  fail<S, M, A = never>(msg: string): ParserT<S, M, A>;
  empty<S, M, A = never>(): ParserT<S, M, A>;

  defer<S, M, A>(thunk: () => ParserT<S, M, A>): ParserT<S, M, A>;

  uncons<S, M, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (t: TokenType<S>) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): ParserT<S, M, A>;
  unconsPrim<S, M, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): ParserT<S, M, A>;
}

ParserT.succeed = succeed;
ParserT.fail = fail;
ParserT.empty = empty;
ParserT.defer = defer;
ParserT.uncons = uncons;
ParserT.unconsPrim = unconsPrim;

interface ParserObj {
  <S, A>(runParser: (s: State<S>) => Consumed<ParseResult<S, A>>): Parser<S, A>;
  succeed<S, A>(x: A): Parser<S, A>;
  fail<S, A = never>(msg: string): Parser<S, A>;
  empty<S, A = never>(): Parser<S, A>;

  defer<S, A>(thunk: () => Parser<S, A>): Parser<S, A>;

  uncons<S, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (t: TokenType<S>) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): Parser<S, A>;
  unconsPrim<S, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): Parser<S, A>;
}

Parser.succeed = succeed;
Parser.fail = fail;
Parser.empty = empty;
Parser.defer = defer;
Parser.uncons = uncons;
Parser.unconsPrim = unconsPrim;