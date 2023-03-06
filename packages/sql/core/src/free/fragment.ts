// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Chain } from '@fp4ts/collections';
import { Read } from '../read';
import { Query0 } from '../query';
import { Update0 } from '../update';

export abstract class Fragment {
  public static get empty(): Fragment {
    return EmptyFragment;
  }

  public static query(q: string): Fragment {
    return new QueryFragment(q);
  }
  public static param(p: unknown): Fragment {
    return new ParamFragment(p);
  }

  public get sql(): string {
    return this.visit(new SqlFragmentVisitor());
  }

  public get params(): Chain<unknown> {
    return this.visit(new ParamFragmentVisitor());
  }

  public concat(that: Fragment): Fragment {
    return new ConcatFragment(this, that);
  }

  public '+++'(that: Fragment): Fragment {
    return this.concat(that);
  }

  public stripMargin(char: string = '|'): Fragment {
    return this._stripMargin(char);
  }
  protected abstract _stripMargin(char: string): Fragment;

  public toString(): string {
    return `[Fragment: ${this.sql}]`;
  }

  public query<A>(): Query0<A>;
  public query<A>(f: (r: Record<string, any>) => A): Query0<A>;
  public query<A>(f: Read<A>): Query0<A>;
  public query(f: any = id): Query0<any> {
    return typeof f === 'function'
      ? Query0(new Read(f), this)
      : Query0(f, this);
  }

  public update(): Update0 {
    return Update0(this);
  }

  public abstract visit<R>(v: FragmentVisitor<R>): R;
}

export abstract class FragmentVisitor<R> {
  public visit(f: Fragment): R {
    return f.visit(this);
  }
  public abstract visitEmpty(f: EmptyFragment): R;
  public abstract visitQuery(f: QueryFragment): R;
  public abstract visitParam(f: ParamFragment): R;
  public abstract visitConcat(f: ConcatFragment): R;
}

class SqlFragmentVisitor extends FragmentVisitor<string> {
  public visitEmpty(f: EmptyFragment): string {
    return '';
  }
  public visitQuery(f: QueryFragment): string {
    return f.value;
  }
  public visitParam(f: ParamFragment): string {
    return '?';
  }
  public visitConcat(f: ConcatFragment): string {
    return f.lhs.visit(this) + f.rhs.visit(this);
  }
}

class ParamFragmentVisitor extends FragmentVisitor<Chain<unknown>> {
  public visitEmpty(f: EmptyFragment): Chain<unknown> {
    return Chain.empty;
  }
  public visitQuery(f: QueryFragment): Chain<unknown> {
    return Chain.empty;
  }
  public visitParam(f: ParamFragment): Chain<unknown> {
    return Chain(f.value);
  }
  public visitConcat(f: ConcatFragment): Chain<unknown> {
    return f.lhs.visit(this)['+++'](f.rhs.visit(this));
  }
}

export const EmptyFragment = new (class EmptyFragment extends Fragment {
  protected _stripMargin(char: string): Fragment {
    return this;
  }
  public visit<R>(v: FragmentVisitor<R>): R {
    return v.visitEmpty(this);
  }
})() as Fragment;
export type EmptyFragment = Fragment;

// https://github.com/sindresorhus/escape-string-regexp/blob/main/index.js
function escapeStringRegexp(string: string): string {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

export class QueryFragment extends Fragment {
  public constructor(public readonly value: string) {
    super();
  }

  protected _stripMargin(char: string): Fragment {
    const regexp = new RegExp(`\n\\s*${escapeStringRegexp(char)}`, 'g');
    return new QueryFragment(this.value.replace(regexp, '\n'));
  }

  public visit<R>(v: FragmentVisitor<R>): R {
    return v.visitQuery(this);
  }
}

export class ParamFragment extends Fragment {
  public constructor(public readonly value: unknown) {
    super();
  }

  protected _stripMargin(char: string): Fragment {
    return this;
  }

  public visit<R>(v: FragmentVisitor<R>): R {
    return v.visitParam(this);
  }
}

export class ConcatFragment extends Fragment {
  public constructor(
    public readonly lhs: Fragment,
    public readonly rhs: Fragment,
  ) {
    super();
  }

  protected _stripMargin(char: string): Fragment {
    return new ConcatFragment(
      this.lhs.stripMargin(char),
      this.rhs.stripMargin(char),
    );
  }

  public visit<R>(v: FragmentVisitor<R>): R {
    return v.visitConcat(this);
  }
}
