// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ticker } from './ticker';

export function ticked(
  run: (ticker: Ticker) => any | Promise<any>,
): () => Promise<any> {
  return () => run(new Ticker());
}
