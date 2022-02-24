// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import { add, complete, cycle, suite } from 'benny';
import { jsonP } from './common/json';

function runTest(fileName: string) {
  const file = fs.readFileSync(fileName);
  const contents = file.toString();
  return add(`Parsing ${fileName}`, () => jsonP.parse(contents));
}

const fileNames = [
  './resources/bar.json',
  './resources/bla2.json',
  './resources/dkw-sample.json',
  './resources/qux1.json',
  './resources/qux2.json',
];

suite('Parser JSON', ...fileNames.map(runTest), cycle(), complete());
