// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import type { SumSchema } from '@fp4ts/schema-kernel';

type DeriveConstructors<T extends string, A extends {}> = {
  [K in Capitalize<keyof A & string>]: Uncapitalize<K> extends infer k
    ? k extends keyof A
      ? (args: Omit<A[k], T>) => A[k]
      : never
    : never;
};

export function deriveConstructors<T extends string, A extends {}>(
  sa: SumSchema<T, A>,
): DeriveConstructors<T, A> {
  type Cs = DeriveConstructors<T, A>;
  const tags = Object.keys(sa.sum) as (keyof A)[];
  const cs: Partial<Cs> = {};

  for (const tag of tags) {
    type tag = typeof tag;
    if (typeof tag !== 'string') throw new Error('Invalid tag type');

    const Tag = `${tag[0].toUpperCase()}${tag.slice(1)}` as keyof Cs;
    cs[Tag] = ((args: Exclude<A[tag], Record<T, tag>>) => ({
      ...args,
      [sa.tag]: tag,
    })) as any;
  }

  return cs as Cs;
}
