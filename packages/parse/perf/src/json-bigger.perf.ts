// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import { jsonP } from './common/json';
import { timed } from './common/timed';

{
  const file = fs.readFileSync('./resources/bla25.json');
  const contents = file.toString();
  timed('@fp4ts bla25', () => jsonP.parse(contents).value);
  timed('native bla25', () => JSON.parse(contents));
}

{
  const file = fs.readFileSync('./resources/ugh10k.json');
  const contents = file.toString();

  timed('@fp4ts ugh10k', () => jsonP.parse(contents).value);
  timed('native ugh10k', () => JSON.parse(contents));
}
