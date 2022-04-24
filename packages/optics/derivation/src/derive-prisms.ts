// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import type { SumSchema } from '@fp4ts/schema';
import { Prism, filtered } from '@fp4ts/optics-core/lib/profunctor';

/* eslint-disable @typescript-eslint/ban-types */
export function derivePrisms<T extends string, A extends {}>(
  sa: SumSchema<T, A>,
): { [k in keyof A]: Prism<A[keyof A], A[k]> } {
  type Ps = { [k in keyof A]: Prism<A[keyof A], A[k]> };
  const tags = Object.keys(sa.sum) as (keyof A)[];
  const res: Partial<Ps> = {};

  for (const tag of tags) {
    res[tag] = filtered<A, any>((x: any): x is any => x[sa.tag] === tag) as any;
  }

  return res as Ps;
}
