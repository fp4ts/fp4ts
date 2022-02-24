// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF, Option, Some } from '@fp4ts/cats';
import { Kind, lazyVal } from '@fp4ts/core';
import { Stream, TokenType } from '@fp4ts/parse-kernel';

import { SourcePosition } from '../source-position';
import { Consumed } from '../consumed';
import { Message } from '../parse-error';
import { ParseError } from '../parse-error';

import { Defer, Empty, Fail, ParserPrim, ParserT, Succeed } from './algebra';
import { ParseResult, Failure, Success } from './parse-result';
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
): ParserT<S, M, A> =>
  new ParserPrim(
    S => s => (cok, cerr, eok, eerr) =>
      S.monad.flatMap_(S.uncons(s.input), opt =>
        opt.fold(
          () => eerr(new Failure(ParseError.unexpected(s.position, ''))),
          ([tok, tl]) =>
            test(tok).fold(
              () =>
                eerr(
                  new Failure(
                    ParseError.unexpected(s.position, showToken(tok)),
                  ),
                ),
              x =>
                cok(
                  new Success(
                    x,
                    new State(tl, nextPos(s.position, tok, tl)),
                    ParseError.empty(s.position),
                  ),
                ),
            ),
        ),
      ),
  );

export const makeParser = <S, A>(
  runParser: (
    S: Stream<S, EvalF>,
  ) => (s: State<S>) => Consumed<ParseResult<S, A>>,
): ParserT<S, EvalF, A> =>
  new ParserPrim(S => s => (cok, cerr, eok, eerr) => {
    const cons = runParser(S)(s);
    return cons.tag === 'consumed'
      ? cons.value.fold(cok, cerr)
      : cons.value.fold(eok, eerr);
  });

export const makeParserT = <S, M, A>(
  runParserT: (
    S: Stream<S, M>,
  ) => (s: State<S>) => Kind<M, [Consumed<Kind<M, [ParseResult<S, A>]>>]>,
): ParserT<S, M, A> =>
  new ParserPrim(S => s => (cok, cerr, eok, eerr) => {
    const F = S.monad;
    return F.flatMap_(runParserT(S)(s), cons =>
      cons.tag === 'consumed'
        ? F.flatMap_(cons.value, r => r.fold(cok, cerr))
        : F.flatMap_(cons.value, r => r.fold(eok, eerr)),
    );
  });
