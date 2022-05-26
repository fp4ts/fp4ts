// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Byte, Char, id } from '@fp4ts/core';
import { Right, Set } from '@fp4ts/cats';
import { Parser, StringSource } from '@fp4ts/parse-core';
import { Rfc5234 } from '@fp4ts/parse-text';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

const charRange = (from: number, to: number): Char[] =>
  [...new Array(to - from + 1).keys()].map(i =>
    String.fromCharCode(from + i),
  ) as Char[];

const allChars = Set(...charRange(0, Char.MaxValue));

describe('RFC 5234', () => {
  function singleCharProperties<A>(
    name: string,
    rule: Parser<StringSource, A>,
    valid: Set<Char>,
    f: (c: Char) => A,
  ) {
    const validArb = fc.oneof(...valid.toArray.map(fc.constant));
    const invalidArb = fc.oneof(
      ...[
        [3, Set(...charRange(0x00, 0x7f))['\\'](valid)] as const,
        [1, Set(...charRange(0x80, 0xff))['\\'](valid)] as const,
        [1, Set(...charRange(0x100, Char.MaxValue))['\\'](valid)] as const,
      ]
        .filter(([, xs]) => xs.nonEmpty)
        .map(([weight, xs]) => ({
          weight,
          arbitrary: fc.oneof(...xs.toArray.map(fc.constant)),
        })),
    ) as Arbitrary<Char>;

    describe(name, () => {
      it(
        'should parse a single valid character',
        forAll(validArb, c => {
          expect(rule.complete().parse(c)).toEqual(Right(f(c)));
          return true;
        }),
      );

      it(
        'should reject a single invalid character',
        forAll(invalidArb, c => rule.complete().parse(c).isLeft),
      );

      it(
        'should reject all but single char',
        forAll(
          fc.stringOf(validArb).filter(s => s.length !== 1),
          s => rule.complete().parse(s).isLeft,
        ),
      );
    });
  }

  const singleConstCharProperties = (
    name: string,
    rule: Parser<StringSource, void>,
    valid: Char,
  ) => singleCharProperties(name, rule, Set(valid), () => {});

  const singleMultiCharProperties = (
    name: string,
    rule: Parser<StringSource, Char>,
    valid: Set<Char>,
  ) => singleCharProperties(name, rule, valid, id);

  singleMultiCharProperties(
    'alpha',
    Rfc5234.alpha(),
    Set(...charRange(0x41, 0x5a), ...charRange(0x61, 0x7a)),
  );
  singleMultiCharProperties(
    'bit',
    Rfc5234.bit(),
    Set('0' as Char, '1' as Char),
  );
  singleMultiCharProperties(
    'char',
    Rfc5234.char(),
    Set(...charRange(0x01, 0x7f)),
  );
  singleConstCharProperties('cr', Rfc5234.cr(), Char.fromByte(0x0d as Byte));
  singleMultiCharProperties(
    'ctl',
    Rfc5234.ctl(),
    Set(...charRange(0x00, 0x1f), Char.fromByte(0x7f as Byte)),
  );
  singleMultiCharProperties(
    'digit',
    Rfc5234.digit(),
    Set(...charRange(0x30, 0x39)),
  );
  singleConstCharProperties(
    'dquote',
    Rfc5234.dquote(),
    Char.fromByte(0x22 as Byte),
  );
  singleMultiCharProperties(
    'hexdig',
    Rfc5234.hexdigit(),
    Set(...(('0123456789' + 'ABCDEF' + 'abcdef').split('') as Char[])),
  );
  singleConstCharProperties(
    'htab',
    Rfc5234.htab(),
    Char.fromByte(0x09 as Byte),
  );
  singleConstCharProperties('lf', Rfc5234.lf(), Char.fromByte(0x0a as Byte));
  singleMultiCharProperties(
    'octet',
    Rfc5234.octet(),
    Set(...charRange(0x00, 0xff)),
  );
  singleConstCharProperties('sp', Rfc5234.sp(), Char.fromByte(0x20 as Byte));
  singleMultiCharProperties(
    'vchar',
    Rfc5234.vchar(),
    Set(...charRange(0x21, 0x7e)),
  );
  singleCharProperties(
    'wsp',
    Rfc5234.wsp(),
    Set(Char.fromByte(0x20 as Byte), Char.fromByte(0x09 as Byte)),
    () => {},
  );

  test('crlf should accept \\r\\n', () => {
    expect(Rfc5234.crlf.complete().parse('\r\n')).toEqual(Right(undefined));
  });

  test(
    'crlf should reject anything but \\r\\n',
    forAll(
      fc.string().filter(s => s !== '\r\n'),
      s => Rfc5234.crlf.complete().parse(s).isLeft,
    ),
  );

  test('lwsp should accept all linear whitespace', () => {
    const wspArb = fc.oneof(
      ...[0x20, 0x09].map(x => String.fromCharCode(x)).map(fc.constant),
    );
    const lwspArb = fc.oneof(
      wspArb,
      wspArb.map(x => `\r\n${x}`),
    );

    forAll(lwspArb, s => Rfc5234.lwsp.complete().parse(s).isRight)();
  });

  test('lwsp should reject \\r\\n unless followed by linear whitespace', () => {
    const arb = A.fp4tsOption(
      fc.oneof(
        ...allChars['\\'](
          Set(Char.fromByte(0x20 as Byte), Char.fromByte(0x09 as Byte)),
        ).toArray.map(fc.constant),
      ),
    ).map(opt => `\r\n${opt.getOrElse(() => '')}`);

    forAll(arb, s => Rfc5234.lwsp.complete().parse(s).isLeft)();
  });
});
