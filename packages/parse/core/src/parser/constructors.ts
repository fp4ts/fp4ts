// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF, Monad, Option, Some } from '@fp4ts/cats';
import { Kind, lazyVal } from '@fp4ts/core';
import { TokenType } from '@fp4ts/parse-kernel';

import { SourcePosition } from '../source-position';
import { Consumed } from '../consumed';
import { Message } from '../parse-error';

import {
  Defer,
  Empty,
  Fail,
  MakeParser,
  MakeParserT,
  ParserT,
  Succeed,
  TokenPrim,
} from './algebra';
import { ParseResult } from './parse-result';
import { State } from './state';
import { label_, notFollowedBy_ } from './operators';

export const succeed = <S, M, A>(x: A): ParserT<S, M, A> => new Succeed(x);

export const unit = <S, M>(): ParserT<S, M, void> => succeed(undefined);

export const fail = <S, M, A = never>(msg: string): ParserT<S, M, A> =>
  new Fail(Message.Raw(msg));

export const unexpected = <S, M, A = never>(msg: string): ParserT<S, M, A> =>
  new Fail(Message.Unexpected(msg));

export const empty = <S, M, A = never>(): ParserT<S, M, A> => new Empty();

export const eof = <S, M>(): ParserT<S, M, void> =>
  label_(notFollowedBy_(unit(), anyToken()), 'end of input');

export const defer = <S, M, A>(
  thunk: () => ParserT<S, M, A>,
): ParserT<S, M, A> => new Defer(lazyVal(thunk));

export const anyToken = <S, M, A>(): ParserT<S, M, TokenType<S>> =>
  tokenPrim(
    x => `${x}`,
    pos => pos,
    Some,
  );

export const token = <S, M, A>(
  showToken: (t: TokenType<S>) => string,
  nextPos: (t: TokenType<S>) => SourcePosition,
  test: (t: TokenType<S>) => Option<A>,
): ParserT<S, M, A> => tokenPrim(showToken, (sp, t, s) => nextPos(t), test);

export const tokenPrim = <S, M, A>(
  showToken: (t: TokenType<S>) => string,
  nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
  test: (t: TokenType<S>) => Option<A>,
): ParserT<S, M, A> => new TokenPrim(showToken, nextPos, test);

export const makeParser = <S, A>(
  runParser: (s: State<S>) => Consumed<ParseResult<S, A>>,
): ParserT<S, EvalF, A> => new MakeParser(runParser);

export const makeParserT = <S, M, A>(
  runParserT: (
    M: Monad<M>,
  ) => (s: State<S>) => Kind<M, [Consumed<Kind<M, [ParseResult<S, A>]>>]>,
): ParserT<S, M, A> => new MakeParserT(runParserT);
