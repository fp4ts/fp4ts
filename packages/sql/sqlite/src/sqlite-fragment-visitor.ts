// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Chain } from '@fp4ts/cats';
import {
  ConcatFragment,
  EmptyFragment,
  FragmentVisitor,
  ParamFragment,
  QueryFragment,
} from '@fp4ts/sql-core/lib/free';

export class SqliteFragment {
  public static readonly empty: SqliteFragment = new SqliteFragment(
    '',
    Chain.empty,
  );
  public static query(q: string): SqliteFragment {
    return new SqliteFragment(q, Chain.empty);
  }
  public static param(p: unknown): SqliteFragment {
    return new SqliteFragment('', Chain(p));
  }

  public constructor(
    public readonly sql: string,
    public readonly params: Chain<unknown>,
  ) {}

  public concat(that: SqliteFragment): SqliteFragment {
    return new SqliteFragment(
      this.sql + that.sql,
      this.params['+++'](that.params),
    );
  }
  public '+++'(that: SqliteFragment): SqliteFragment {
    return this.concat(that);
  }
}

export class SqliteFragmentVisitor extends FragmentVisitor<SqliteFragment> {
  private paramCount: number = 0;

  public visitEmpty(f: EmptyFragment): SqliteFragment {
    return SqliteFragment.empty;
  }
  public visitQuery(f: QueryFragment): SqliteFragment {
    return SqliteFragment.query(f.value);
  }
  public visitParam(f: ParamFragment): SqliteFragment {
    return SqliteFragment.query('?')['+++'](SqliteFragment.param(f.value));
  }
  public visitConcat(f: ConcatFragment): SqliteFragment {
    return f.lhs.visit(this)['+++'](f.rhs.visit(this));
  }
}
