// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
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

  public concat(that: Fragment): Fragment {
    return new ConcatFragment(this, that);
  }

  public '+++'(that: Fragment): Fragment {
    return this.concat(that);
  }

  public toString(): string {
    return `[Fragment: ${'this.sql'}]`;
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

export const EmptyFragment = new (class EmptyFragment extends Fragment {
  public visit<R>(v: FragmentVisitor<R>): R {
    return v.visitEmpty(this);
  }
})();
export type EmptyFragment = Fragment;

export class QueryFragment extends Fragment {
  public constructor(public readonly value: string) {
    super();
  }

  public visit<R>(v: FragmentVisitor<R>): R {
    return v.visitQuery(this);
  }
}

export class ParamFragment extends Fragment {
  public constructor(public readonly value: unknown) {
    super();
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

  public visit<R>(v: FragmentVisitor<R>): R {
    return v.visitConcat(this);
  }
}
