// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char, throwError } from '@fp4ts/core';
import { EvalF, None, Some } from '@fp4ts/cats';
import {
  Consumed,
  Failure,
  Message,
  ParseError,
  Parser,
  ParserT,
  State,
  StringSource,
  Success,
} from '@fp4ts/parse-core';
import {
  updatePositionByChar,
  updatePositionByString,
} from './source-position';
import { HasTokenType, TokenType } from '@fp4ts/parse-kernel';

const alphaRegex = /^[a-zA-Z]/;
const digitRegex = /^[0-9]/;
const alphaNumRegex = /^\w/;
const whitespaceRegex = /^\s/;

export const satisfy = <S extends HasTokenType<Char> = StringSource, F = EvalF>(
  p: (c: Char) => boolean,
): ParserT<S, F, Char> =>
  ParserT.tokenPrim<S, F, Char>(
    c => `'${c}'`,
    (sp, t) => updatePositionByChar(sp, t),
    x => (p(x) ? Some(x) : None),
  );

export const char = <S extends HasTokenType<Char> = StringSource, F = EvalF>(
  c: Char,
): ParserT<S, F, Char> => satisfy<S, F>(x => x === c)['<?>'](`'${c}'`);

export const anyChar = <S extends HasTokenType<Char> = StringSource>(): Parser<
  S,
  Char
> => satisfy(() => true);

export const letter = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => alphaRegex.test(x))['<?>']('letter');
export const digit = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => digitRegex.test(x))['<?>']('digit');
export const alphaNum = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => alphaNumRegex.test(x))['<?>']('letter or digit');
export const space = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => whitespaceRegex.test(x))['<?>']('space');
export const spaces = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, void> => space<S, F>().skipRep()['<?>']('white space');

export const parens = <
  A,
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(
  p: ParserT<S, F, A>,
): ParserT<S, F, A> => p.between(char('(' as Char), char(')' as Char));

export const string = (str: string): Parser<StringSource, string> =>
  str === ''
    ? Parser.succeed('') // -- Trivial success
    : Parser(S => s => {
        let input = s.input;
        for (let i = 0, len = str.length; i < len; i++) {
          const h = input.uncons;
          if (h.isEmpty) {
            if (i === 0) {
              return Consumed.Empty(
                new Failure(
                  ParseError.unexpected(s.position, '').addMessage(
                    Message.Expected(str),
                  ),
                ),
              );
            } else {
              return Consumed.Consumed(
                new Failure(
                  ParseError.unexpected(s.position, '').addMessage(
                    Message.Expected(str),
                  ),
                ),
              );
            }
          }

          const [hd, tl] = h.get;
          const t = str.charAt(i);
          if (t !== hd) {
            if (i === 0) {
              return Consumed.Empty(
                new Failure(
                  ParseError.unexpected(s.position, hd).addMessage(
                    Message.Expected(str),
                  ),
                ),
              );
            } else {
              return Consumed.Consumed(
                new Failure(
                  ParseError.unexpected(s.position, hd).addMessage(
                    Message.Expected(str),
                  ),
                ),
              );
            }
          }

          input = tl;
        }

        const newPos = updatePositionByString(s.position, str);
        return Consumed.Consumed(
          new Success(str, new State(input, newPos), ParseError.empty(newPos)),
        );
      });

const arrToString = (xs: Char[]): string => xs.join('');
export const stringF = <S extends HasTokenType<Char> = StringSource, F = EvalF>(
  str: string,
): ParserT<S, F, string> => {
  const tts = str.split('') as TokenType<S>[];

  return ParserT.tokens<S, F>(
    arrToString,
    (sp, ts) => updatePositionByString(sp, arrToString(ts)),
    tts,
  ).map(arrToString);
};

/**
 * **WARNING:** as we cannot check for partial prefix match of the regex, this
 * combinator is _always_ backtracking. I.e., can produce either _consumed ok_,
 * or _empty error_.
 */
export const regex = (re: RegExp): Parser<StringSource, string> =>
  !re.source.startsWith('^')
    ? throwError(
        new Error(
          'RegExpError: Parser regular expressions mush start with `^`',
        ),
      )
    : Parser(S => s => {
        const m = s.input.source
          .substring(s.input.cursor - 1, s.input.source.length)
          .match(re);
        const r = m?.[0];
        return r != null
          ? r === ''
            ? Consumed.Empty(new Success('', s, ParseError.empty(s.position)))
            : Consumed.Consumed(
                new Success(
                  r,
                  new State(
                    s.input.drop(r.length),
                    updatePositionByString(s.position, r),
                  ),
                  ParseError.empty(s.position),
                ),
              )
          : Consumed.Empty(
              new Failure(
                new ParseError(s.position, [
                  Message.Expected(`Re(${re.source})`),
                ]),
              ),
            );
      });
