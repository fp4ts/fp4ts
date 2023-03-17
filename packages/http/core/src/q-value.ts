// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char, EvalF, Lazy, lazy, newtype } from '@fp4ts/core';
import { parser, Parser, StringSource, text, Rfc5234 } from '@fp4ts/parse';
import { ParseResult, Rfc7230 } from './parsing';

export const QValue = class extends newtype<number>()(
  '@fp4ts/http/core/q-value',
) {
  static readonly one = this.unsafeWrap(1_000);
  static readonly zero = this.unsafeWrap(0);

  static readonly toThousands = this.unwrap;

  static override toString(q: QValue): string {
    // toFixed used to ensure correct rounding
    return `;q=${(0.001 * this.unwrap(q)).toFixed(3)}`;
  }

  static fromThousands(x: number): ParseResult<QValue> {
    return mkQValue(x, `${0.001 * x}`);
  }
  static fromNumber(x: number): ParseResult<QValue> {
    return mkQValue((x * 1_000) | 0, `${x}`);
  }
  static fromString(s: string): ParseResult<QValue> {
    const x = parseFloat(s);
    return Number.isNaN(x)
      ? ParseResult.fail('Invalid q-value', `${s} is not a number`)
      : ParseResult.success(this.unsafeWrap(x));
  }

  static get parser(): Parser<StringSource, QValue> {
    return parser_();
  }
};
export type QValue = (typeof QValue)['Type'];

const mkQValue = (thousands: number, s: string): ParseResult<QValue> =>
  thousands < 0 || thousands > 1_000
    ? ParseResult.fail('Invalid q-value', `${s} must be between 0.0 and 1.0`)
    : ParseResult.success(QValue.unsafeWrap(thousands));

const parser_: Lazy<Parser<StringSource, QValue>> = lazy(() => {
  const eof = Parser.eof<StringSource, EvalF>();
  const ch = text.char;
  const decQValue = Rfc5234.digit<StringSource, EvalF>()
    .repAs1<string>('', (x, y) => x + y)
    .collect(s => QValue.fromString(s).toOption);

  const qvalue = ch('0' as Char)
    ['*>'](eof.as(QValue.zero).orElse(text.char('.' as Char)['*>'](decQValue)))
    .orElse(
      ch('1' as Char)
        ['*>'](
          ch('.' as Char)
            ['*>'](ch('0' as Char).rep())
            .optional(),
        )
        .as(QValue.one),
    );

  return parser`;${Rfc7230.ows}${text.oneOf('qQ')}=${qvalue}`
    .backtrack()
    .map(([, , q]) => q)
    .orElse(Parser.succeed(QValue.one));
});
