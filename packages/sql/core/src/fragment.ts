// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Chain } from '@fp4ts/cats';
import { id } from '@fp4ts/core';
import { Query, Read } from './query';

class Fragment {
  public static readonly empty: Fragment = new Fragment('', Chain.empty);

  public static readonly placeholder: Fragment = new Fragment('?', Chain.empty);

  public static query(q: string): Fragment {
    return new Fragment(q, Chain.empty);
  }
  public static param(p: unknown): Fragment {
    return new Fragment('', Chain(p));
  }

  public constructor(
    public readonly sql: string,
    public readonly params: Chain<unknown>,
  ) {}

  public concat(that: Fragment): Fragment {
    return new Fragment(this.sql + that.sql, this.params['+++'](that.params));
  }

  public '+++'(that: Fragment): Fragment {
    return this.concat(that);
  }

  public toString(): string {
    return `[Fragment: ${this.sql}]`;
  }

  public query<A>(): Query<A>;
  public query<A>(f: (r: Record<string, any>) => A): Query<A>;
  public query<A>(f: Read<A>): Query<A>;
  public query(f: any = id): Query<any> {
    return typeof f === 'function'
      ? new Query(this.sql, this.params, new Read(f))
      : new Query(this.sql, this.params, f);
  }
}

export function fr(strings: TemplateStringsArray, ...xs: unknown[]): Fragment {
  return fr0(strings, ...xs)['+++'](Fragment.query(' '));
}

export function fr0(strings: TemplateStringsArray, ...xs: unknown[]): Fragment {
  let acc: Fragment = Fragment.empty;
  let i = 0;
  let j = 0;
  while (i < strings.length && j < xs.length) {
    acc = acc['+++'](Fragment.query(strings[i++]));
    acc = acc['+++'](Fragment.placeholder);
    acc = acc['+++'](Fragment.param(xs[j++]));
  }
  while (i < strings.length) {
    acc = acc['+++'](Fragment.query(strings[i++]));
  }
  while (j < xs.length) {
    acc = acc['+++'](Fragment.placeholder);
    acc = acc['+++'](Fragment.param(xs[j++]));
  }
  return acc;
}

export function sql(strings: TemplateStringsArray, ...xs: unknown[]): Fragment {
  return fr0(strings, ...xs);
}

const x = sql`
  select *
    from person
   where first_name = "James"
`.query<{ first_name: string; last_name: string }>();
