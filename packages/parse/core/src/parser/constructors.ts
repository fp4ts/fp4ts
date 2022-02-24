// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, lazyVal, PrimitiveType, tupled } from '@fp4ts/core';
import {
  Either,
  Eq,
  EvalF,
  Left,
  List,
  Option,
  Right,
  Some,
} from '@fp4ts/cats';
import { HasTokenType, Stream, TokenType } from '@fp4ts/parse-kernel';

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

export function tokens<S extends HasTokenType<PrimitiveType>, F>(
  showTokens: (t: List<TokenType<S>>) => string,
  nextPos: (sp: SourcePosition, ts: List<TokenType<S>>) => SourcePosition,
  tts: List<TokenType<S>>,
): ParserT<S, F, List<TokenType<S>>>;
export function tokens<S, F>(
  showTokens: (t: List<TokenType<S>>) => string,
  nextPos: (sp: SourcePosition, ts: List<TokenType<S>>) => SourcePosition,
  tts: List<TokenType<S>>,
  E: Eq<TokenType<S>>,
): ParserT<S, F, List<TokenType<S>>>;
export function tokens<S, F>(
  showTokens: (t: List<TokenType<S>>) => string,
  nextPos: (sp: SourcePosition, ts: List<TokenType<S>>) => SourcePosition,
  tts: List<TokenType<S>>,
  E: Eq<TokenType<S>> = Eq.fromUniversalEquals(),
): ParserT<S, F, List<TokenType<S>>> {
  return new ParserPrim<S, F, List<TokenType<S>>>(
    S =>
      s =>
      <B>(
        cok: (suc: Success<S, List<TokenType<S>>>) => Kind<F, [B]>,
        cerr: (fail: Failure) => Kind<F, [B]>,
        eok: (suc: Success<S, List<TokenType<S>>>) => Kind<F, [B]>,
        eerr: (fail: Failure) => Kind<F, [B]>,
      ): Kind<F, [B]> => {
        if (tts.isEmpty)
          return eok(new Success(List.empty, s, ParseError.empty(s.position)));

        const errEof = () =>
          new Failure(
            new ParseError(s.position, [Message.Unexpected('')]).withMessage(
              Message.Expected(showTokens(tts)),
            ),
          );
        const errExpect = (x: TokenType<S>) =>
          new Failure(
            new ParseError(s.position, [Message.Unexpected('')]).withMessage(
              Message.Expected(showTokens(List(x))),
            ),
          );

        const ok = (rs: S): Kind<F, [B]> => {
          const pos = nextPos(s.position, tts);
          const newState = new State(rs, pos);
          return cok(new Success(tts, newState, ParseError.empty(pos)));
        };

        const F = S.monad;
        const walk = (ts: List<TokenType<S>>, xs: S) =>
          F.tailRecM(tupled(ts, xs))(
            ([ts, rs]): Kind<F, [Either<[List<TokenType<S>>, S], B>]> =>
              ts.uncons.fold(
                () => F.map_(ok(rs), Right),
                ([t, ts]) =>
                  F.flatMap_(S.uncons(rs), opt =>
                    opt.fold(
                      () => F.map_(cerr(errEof()), Right),
                      ({ 0: x, 1: xs }) =>
                        E.equals(t, x)
                          ? F.pure(Left(tupled(ts, xs)))
                          : F.map_(cerr(errExpect(x)), Right),
                    ),
                  ),
              ),
          );

        return F.flatMap_(S.uncons(s.input), opt =>
          opt.fold(
            () => eerr(errEof()),
            ([x, xs]) =>
              E.equals(tts.head, x) ? walk(tts.tail, xs) : eerr(errExpect(x)),
          ),
        );
      },
  );
}

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
