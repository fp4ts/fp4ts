// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import type { StructSchema } from '@fp4ts/schema';

import { Lens, prop } from '@fp4ts/optics-core';

/* eslint-disable @typescript-eslint/ban-types */
export function deriveLenses<A extends {}>(
  sa: StructSchema<A>,
): { [k in keyof A]: Lens<A, A[k]> } {
  type Ls = { [k in keyof A]: Lens<A, A[k]> };
  const keys = Object.keys(sa.struct) as (keyof A)[];
  const res: Partial<Ls> = {};

  for (const k of keys) {
    res[k] = prop<A, typeof k>(k);
  }

  return res as Ls;
}
