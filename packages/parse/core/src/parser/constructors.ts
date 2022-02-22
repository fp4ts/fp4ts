// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '@fp4ts/cats';
import { lazyVal } from '@fp4ts/core';
import { SourcePosition } from '../source-position';
import { TokenType } from '../token-type';
import { Defer, Empty, Fail, ParserT, Succeed, UnconsPrim } from './algebra';

export const succeed = <S, M, A>(x: A): ParserT<S, M, A> => new Succeed(x);

export const fail = <S, M, A = never>(msg: string): ParserT<S, M, A> =>
  new Fail(msg);
export const empty = <S, M, A = never>(): ParserT<S, M, A> => new Empty();

export const defer = <S, M, A>(
  thunk: () => ParserT<S, M, A>,
): ParserT<S, M, A> => new Defer(lazyVal(thunk));

export const uncons = <S, M, A>(
  showToken: (t: TokenType<S>) => string,
  nextPos: (t: TokenType<S>) => SourcePosition,
  test: (t: TokenType<S>) => Option<A>,
): ParserT<S, M, A> => unconsPrim(showToken, (sp, t, s) => nextPos(t), test);

export const unconsPrim = <S, M, A>(
  showToken: (t: TokenType<S>) => string,
  nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
  test: (t: TokenType<S>) => Option<A>,
): ParserT<S, M, A> => new UnconsPrim(showToken, nextPos, test);
