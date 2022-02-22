// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF, Option } from '@fp4ts/cats';
import { SourcePosition } from '../source-position';
import { TokenType } from '../token-type';
import { ParserT as ParserTBase } from './algebra';
import {
  defer,
  empty,
  fail,
  succeed,
  uncons,
  unconsPrim,
} from './constructors';

export type ParserT<S, M, A> = ParserTBase<S, M, A>;

export type Parser<S, A> = ParserT<S, EvalF, A>;

export const ParserT: ParserTObj = function () {};
export const Parser: ParserObj = function () {};

interface ParserTObj {
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
