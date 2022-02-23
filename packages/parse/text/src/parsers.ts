// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char, id, throwError } from '@fp4ts/core';
import { None, Some } from '@fp4ts/cats';
import {
  Consumed,
  Failure,
  ParseError,
  Parser,
  State,
  StringSource,
  Success,
} from '@fp4ts/parse-core';
import {
  updatePositionByChar,
  updatePositionByString,
} from './source-position';

const alphaRegex = /^[a-zA-Z]/;
const digitRegex = /^[0-9]/;
const alphaNumRegex = /^\w/;
const whitespaceRegex = /^\s/;

export const satisfy = (p: (c: Char) => boolean): Parser<StringSource, Char> =>
  Parser.unconsPrim<StringSource, Char>(
    id,
    (sp, t) => updatePositionByChar(sp, t),
    x => (p(x) ? Some(x) : None),
  );

export const char = (c: Char): Parser<StringSource, Char> =>
  satisfy(x => x === c);

export const anyChar: Parser<StringSource, Char> = satisfy(() => true);

export const letter: Parser<StringSource, Char> = satisfy(x =>
  alphaRegex.test(x),
);
export const digit: Parser<StringSource, Char> = satisfy(x =>
  digitRegex.test(x),
);
export const alphaNum: Parser<StringSource, Char> = satisfy(x =>
  alphaNumRegex.test(x),
);
export const space: Parser<StringSource, Char> = satisfy(x =>
  whitespaceRegex.test(x),
);
export const spaces: Parser<StringSource, void> = space.skipRep();

export const parens = <A>(
  p: Parser<StringSource, A>,
): Parser<StringSource, A> => p.between(char('(' as Char), char(')' as Char));

export const string = (str: string): Parser<StringSource, string> =>
  str === ''
    ? Parser.succeed('') // -- Trivial success
    : Parser(s => {
        let input = s.input;
        for (let i = 0, len = str.length; i < len; i++) {
          const h = input.uncons;
          if (h.isEmpty) {
            if (i === 0) {
              return Consumed.Empty(
                new Failure(
                  new ParseError(s.position, [
                    `Unexpected EOF, expected ${str}`,
                  ]),
                ),
              );
            } else {
              return Consumed.Consumed(
                new Failure(
                  new ParseError(
                    updatePositionByString(s.position, str.substring(0, i)),
                    [`Unexpected EOF, expected ${str}`],
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
                  new ParseError(s.position, [
                    `Unexpected token ${t}, expected ${str}`,
                  ]),
                ),
              );
            } else {
              return Consumed.Consumed(
                new Failure(
                  new ParseError(
                    updatePositionByString(s.position, str.substring(0, i)),
                    [`Unexpected token ${t}, expected ${str}`],
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
    : Parser(s => {
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
                new ParseError(s.position, [`Did not match ${re.source}`]),
              ),
            );
      });
