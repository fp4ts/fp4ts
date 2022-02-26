// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Parser, StringSource } from '@fp4ts/parse-core';
import { string } from './parsers';

export function parser<PS extends Parser<StringSource, any>[]>(
  strings: TemplateStringsArray,
  ...ps: PS
): Parser<
  StringSource,
  { [k in keyof PS]: PS[k] extends Parser<any, infer A> ? A : never }
> {
  let acc: Parser<StringSource, any[]> = Parser.succeed([] as any[]);
  let i = 0;
  let j = 0;
  while (i < strings.length && j < ps.length) {
    acc = acc['<*'](string(strings[i++]));
    acc = acc.map2(ps[j++], (xs, x) => [...xs, x]);
  }
  if (i < strings.length) {
    acc = acc['<*'](string(strings.slice(i).join('')));
  }
  while (j < ps.length) {
    acc = acc.map2(ps[j++], (xs, x) => [...xs, x]);
  }
  return acc as any;
}
