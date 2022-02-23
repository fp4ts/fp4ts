// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import { Char } from '@fp4ts/core';
import { Parser, StringSource } from '@fp4ts/parse-core';
import { char, regex, spaces, string } from '@fp4ts/parse-text';

type Json =
  | { tag: 'null' }
  | { tag: 'boolean'; value: boolean }
  | { tag: 'number'; value: number }
  | { tag: 'string'; value: string }
  | { tag: 'array'; value: Json[] }
  | { tag: 'object'; value: Record<string, Json> };

const JNull: Json = { tag: 'null' };
const JBool = (value: boolean): Json => ({ tag: 'boolean', value });
const JNumber = (value: number): Json => ({ tag: 'number', value });
const JString = (value: string): Json => ({ tag: 'string', value });
const JArray = (value: Json[]): Json => ({ tag: 'array', value });
const JObject = (value: Record<string, Json>): Json => ({
  tag: 'object',
  value,
});
{
  const jsonP: Parser<StringSource, Json> = Parser.defer(() => nullP)
    ['<|>'](() => boolP)
    ['<|>'](() => numberP)
    ['<|>'](() => stringP)
    ['<|>'](() => arrayP)
    ['<|>'](() => objectP);

  const nullP = string('null').as(JNull);
  const boolP = string('true')
    ['<|>'](() => string('false'))
    .map(Boolean)
    .map(JBool);

  const numberP = regex(/^-?\d+(\.(\d+)?)?(e[-+]?\d+)?/)
    .map(Number)
    .map(JNumber);
  const rawStringP = regex(/^"(?:[^"\\]|\\.)*"/)
    .map(s => s.slice(1, s.length - 1))
    // strip leading  ^      ^ and trailing quote
    .map(s => s.replace(/\\"/g, '"'))
    //                     ^ unescape "
    .map(s => s.replace(/\\\\/g, '\\'));
  //                     ^ unescape \

  const stringP = rawStringP.map(JString);

  const sep = char(',' as Char).surroundedBy(spaces);
  const arrayP = jsonP
    .sepBy(sep)
    .surroundedBy(spaces)
    .between(char('[' as Char), char(']' as Char))
    .map(xs => JArray(xs.toArray));

  const kv: Parser<StringSource, [string, Json]> = rawStringP['<*'](
    char(':' as Char).surroundedBy(spaces),
  ).product(jsonP);
  const objectP: Parser<StringSource, Json> = kv
    .sepBy(sep)
    .surroundedBy(spaces)
    .between(char('{' as Char), char('}' as Char))
    .map(xs =>
      JObject(
        xs.foldLeft({} as Record<string, Json>, (xs, [k, v]) => ({
          ...xs,
          [k]: v,
        })),
      ),
    );

  const timed = (msg: string, f: () => void): void => {
    const start = Date.now();
    f();
    const end = Date.now();
    console.log(`${msg}: ${end - start}ms`);
  };

  {
    const file = fs.readFileSync('./src/resources/bla2.json');
    const contents = file.toString();
    timed('@fp4ts bla2', () => jsonP.parse(contents));
    timed('native bla2', () => JSON.parse(contents));
  }

  {
    const file = fs.readFileSync('./src/resources/ugh10k.json');
    const contents = file.toString();

    timed('@fp4ts ugh10k', () => jsonP.parse(contents));
    timed('native ugh10k', () => jsonP.parse(contents));
  }
}
