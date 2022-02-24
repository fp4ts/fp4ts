// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, PrimitiveType } from '@fp4ts/core';
import { Eq, EvalF, List, Option } from '@fp4ts/cats';
import { HasTokenType, Stream, TokenType } from '@fp4ts/parse-kernel';

import { Consumed } from '../consumed';
import { SourcePosition } from '../source-position';

import { ParserT as ParserTBase } from './algebra';
import {
  defer,
  empty,
  fail,
  makeParser,
  makeParserT,
  succeed,
  token,
  tokenPrim,
  tokens,
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
  <S, F, A>(
    runParserT: (
      S: Stream<S, F>,
    ) => (s: State<S>) => Kind<F, [Consumed<Kind<F, [ParseResult<S, A>]>>]>,
  ): ParserT<S, F, A>;
  succeed<S, F, A>(x: A): ParserT<S, F, A>;
  fail<S, F, A = never>(msg: string): ParserT<S, F, A>;
  empty<S, F, A = never>(): ParserT<S, F, A>;

  defer<S, F, A>(thunk: () => ParserT<S, F, A>): ParserT<S, F, A>;

  token<S, F, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (t: TokenType<S>) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): ParserT<S, F, A>;
  tokenPrim<S, F, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): ParserT<S, F, A>;

  tokens<S extends HasTokenType<PrimitiveType>, M>(
    showTokens: (t: List<TokenType<S>>) => string,
    nextPos: (sp: SourcePosition, ts: List<TokenType<S>>) => SourcePosition,
    tts: List<TokenType<S>>,
  ): ParserT<S, M, List<TokenType<S>>>;
  tokens<S, F>(
    showTokens: (t: List<TokenType<S>>) => string,
    nextPos: (sp: SourcePosition, ts: List<TokenType<S>>) => SourcePosition,
    tts: List<TokenType<S>>,
    E: Eq<TokenType<S>>,
  ): ParserT<S, F, List<TokenType<S>>>;
}

ParserT.succeed = succeed;
ParserT.fail = fail;
ParserT.empty = empty;
ParserT.defer = defer;
ParserT.token = token;
ParserT.tokenPrim = tokenPrim;
ParserT.tokens = tokens;

interface ParserObj {
  <S, A>(
    runParser: (
      S: Stream<S, EvalF>,
    ) => (s: State<S>) => Consumed<ParseResult<S, A>>,
  ): Parser<S, A>;
  succeed<S, A>(x: A): Parser<S, A>;
  fail<S, A = never>(msg: string): Parser<S, A>;
  empty<S, A = never>(): Parser<S, A>;

  defer<S, A>(thunk: () => Parser<S, A>): Parser<S, A>;

  token<S, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (t: TokenType<S>) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): Parser<S, A>;
  tokenPrim<S, A>(
    showToken: (t: TokenType<S>) => string,
    nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
    test: (t: TokenType<S>) => Option<A>,
  ): Parser<S, A>;

  tokens<S extends HasTokenType<PrimitiveType>>(
    showTokens: (t: List<TokenType<S>>) => string,
    nextPos: (sp: SourcePosition, ts: List<TokenType<S>>) => SourcePosition,
    tts: List<TokenType<S>>,
  ): Parser<S, List<TokenType<S>>>;
  tokens<S>(
    showTokens: (t: List<TokenType<S>>) => string,
    nextPos: (sp: SourcePosition, ts: List<TokenType<S>>) => SourcePosition,
    tts: List<TokenType<S>>,
    E: Eq<TokenType<S>>,
  ): Parser<S, List<TokenType<S>>>;
}

Parser.succeed = succeed;
Parser.fail = fail;
Parser.empty = empty;
Parser.defer = defer;
Parser.token = token;
Parser.tokenPrim = tokenPrim;
Parser.tokens = tokens;
