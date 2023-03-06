// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Chain } from '@fp4ts/collections';
import {
  ConcatFragment,
  EmptyFragment,
  FragmentVisitor,
  ParamFragment,
  QueryFragment,
} from '@fp4ts/sql-core/lib/free';

export class PgFragment {
  public static readonly empty: PgFragment = new PgFragment('', Chain.empty);
  public static query(q: string): PgFragment {
    return new PgFragment(q, Chain.empty);
  }
  public static param(p: unknown): PgFragment {
    return new PgFragment('', Chain(p));
  }

  public constructor(
    public readonly sql: string,
    public readonly params: Chain<unknown>,
  ) {}

  public concat(that: PgFragment): PgFragment {
    return new PgFragment(this.sql + that.sql, this.params['+++'](that.params));
  }
  public '+++'(that: PgFragment): PgFragment {
    return this.concat(that);
  }
}

export class PgFragmentVisitor extends FragmentVisitor<PgFragment> {
  private paramCount: number = 0;

  public visitEmpty(f: EmptyFragment): PgFragment {
    return PgFragment.empty;
  }
  public visitQuery(f: QueryFragment): PgFragment {
    return PgFragment.query(f.value);
  }
  public visitParam(f: ParamFragment): PgFragment {
    return PgFragment.query(`$${++this.paramCount}`)['+++'](
      PgFragment.param(f.value),
    );
  }
  public visitConcat(f: ConcatFragment): PgFragment {
    return f.lhs.visit(this)['+++'](f.rhs.visit(this));
  }
}
