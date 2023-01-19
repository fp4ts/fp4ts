// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import * as C from 'parser-ts/lib/char';
import * as P from 'parser-ts/lib/Parser';
import * as S from 'parser-ts/Stream';
import { Char, pipe } from '@fp4ts/core';
import { text } from '@fp4ts/parse-text';

import { timed } from './common/timed';

{
  const number = pipe(
    P.many1(C.digit),
    P.map(xs => parseInt(xs.join(''))),
  );
  const expr = pipe(
    number,
    P.chain(h =>
      pipe(
        P.many(P.apSecond(number)(C.char('+'))),
        P.map(xs => xs.reduce((a, b) => a + b, h)),
      ),
    ),
  );

  const input = '1' + '+1'.repeat(50_000);

  timed('parse-ts', () => console.log(expr(S.stream(input.split('')))));
}

{
  const number = text.digits1().map(Number);
  const expr = number
    .sepBy1(text.char('+' as Char))
    .map(xs => xs.foldLeft(0, (a, b) => a + b));

  const input = '1' + '+1'.repeat(50_000);
  timed('@fp4ts', () => console.log(expr.parse(input).value));
}
