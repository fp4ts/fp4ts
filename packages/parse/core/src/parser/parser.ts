// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, PrimitiveType, TyK, TyVar } from '@fp4ts/core';
import {
  Alternative,
  Eq,
  EvalF,
  Functor,
  FunctorFilter,
  IdentityF,
  Monad,
  MonoidK,
  Option,
} from '@fp4ts/cats';
import { HasTokenType, Stream, TokenType } from '@fp4ts/parse-kernel';

import { Consumed } from '../consumed';
import { SourcePosition } from '../source-position';

import { ParserT as ParserTBase } from './algebra';
import {
  anyToken,
  defer,
  empty,
  eof,
  fail,
  makeParser,
  makeParserT,
  succeed,
  token,
  tokenPrim,
  tokens,
  unit,
} from './constructors';
import { ParseResult } from './parse-result';
import { State } from './state';
import {
  parserTAlternative,
  parserTFunctor,
  parserTFunctorFilter,
  parserTMonad,
  parserTMonoidK,
} from './instances';

export type ParserT<S, F, A> = ParserTBase<S, F, A>;

export type Parser<S, A> = ParserT<S, IdentityF, A>;

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
  unit<S, F>(): ParserT<S, F, void>;
  empty<S, F, A = never>(): ParserT<S, F, A>;

  defer<S, F, A>(thunk: () => ParserT<S, F, A>): ParserT<S, F, A>;

  eof<S, F>(): ParserT<S, F, void>;

  anyToken<S, F>(): ParserT<S, F, TokenType<S>>;
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
    showTokens: (t: TokenType<S>[]) => string,
    nextPos: (sp: SourcePosition, ts: TokenType<S>[]) => SourcePosition,
    tts: TokenType<S>[],
  ): ParserT<S, M, TokenType<S>[]>;
  tokens<S, F>(
    showTokens: (t: TokenType<S>[]) => string,
    nextPos: (sp: SourcePosition, ts: TokenType<S>[]) => SourcePosition,
    tts: TokenType<S>[],
    E: Eq<TokenType<S>>,
  ): ParserT<S, F, TokenType<S>[]>;

  // -- Instances

  MonoidK<S, F>(): MonoidK<$<ParserTF, [S, F]>>;
  Functor<S, F>(): Functor<$<ParserTF, [S, F]>>;
  FunctorFilter<S, F>(): FunctorFilter<$<ParserTF, [S, F]>>;
  Alternative<S, F>(): Alternative<$<ParserTF, [S, F]>>;
  Monad<S, F>(): Monad<$<ParserTF, [S, F]>>;
}

ParserT.succeed = succeed;
ParserT.fail = fail;
ParserT.unit = unit;
ParserT.empty = empty;
ParserT.defer = defer;
ParserT.eof = eof;
ParserT.anyToken = anyToken;
ParserT.token = token;
ParserT.tokenPrim = tokenPrim;
ParserT.tokens = tokens;

ParserT.MonoidK = parserTMonoidK;
ParserT.Functor = parserTFunctor;
ParserT.FunctorFilter = parserTFunctorFilter;
ParserT.Alternative = parserTAlternative;
ParserT.Monad = parserTMonad;

interface ParserObj {
  <S, A>(
    runParser: (
      S: Stream<S, IdentityF>,
    ) => (s: State<S>) => Consumed<ParseResult<S, A>>,
  ): Parser<S, A>;
  succeed<S, A>(x: A): Parser<S, A>;
  fail<S, A = never>(msg: string): Parser<S, A>;
  unit<S>(): Parser<S, void>;
  empty<S, A = never>(): Parser<S, A>;

  defer<S, A>(thunk: () => Parser<S, A>): Parser<S, A>;

  eof<S>(): Parser<S, void>;

  anyToken<S>(): Parser<S, TokenType<S>>;
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
    showTokens: (t: TokenType<S>[]) => string,
    nextPos: (sp: SourcePosition, ts: TokenType<S>[]) => SourcePosition,
    tts: TokenType<S>[],
  ): Parser<S, TokenType<S>[]>;
  tokens<S>(
    showTokens: (t: TokenType<S>[]) => string,
    nextPos: (sp: SourcePosition, ts: TokenType<S>[]) => SourcePosition,
    tts: TokenType<S>[],
    E: Eq<TokenType<S>>,
  ): Parser<S, TokenType<S>[]>;

  // -- instances

  MonoidK<S>(): MonoidK<$<ParserTF, [S, EvalF]>>;
  Functor<S>(): Functor<$<ParserTF, [S, EvalF]>>;
  FunctorFilter<S>(): FunctorFilter<$<ParserTF, [S, EvalF]>>;
  Alternative<S>(): Alternative<$<ParserTF, [S, EvalF]>>;
  Monad<S>(): Monad<$<ParserTF, [S, EvalF]>>;
}

Parser.succeed = succeed;
Parser.fail = fail;
Parser.unit = unit;
Parser.empty = empty;
Parser.defer = defer;
Parser.eof = eof;
Parser.anyToken = anyToken;
Parser.token = token;
Parser.tokenPrim = tokenPrim;
Parser.tokens = tokens;

Parser.MonoidK = parserTMonoidK;
Parser.Functor = parserTFunctor;
Parser.FunctorFilter = parserTFunctorFilter;
Parser.Alternative = parserTAlternative;
Parser.Monad = parserTMonad;

// -- HKT

export interface ParserTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: ParserT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
export interface ParserF extends TyK<[unknown, unknown]> {
  [$type]: Parser<TyVar<this, 0>, TyVar<this, 1>>;
}
