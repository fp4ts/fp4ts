// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Lazy } from '@fp4ts/core';
import { Eq } from './eq';
import { Compare, Ord } from './ord';
import { Semigroup } from './semigroup';

export type Syntax<TC extends Base<any>> = _Syntax<TC>;
export function Syntax<TC extends Base<any>>(
  TC: TC,
): SyntaxPartiallyApplied<TC>;
export function Syntax<TC extends Base<any>>(
  TC: TC,
  value: TC['_F'],
): Syntax<TC>;
export function Syntax(...args: any[]): any {
  return args.length === 1
    ? (value: any) => new _Syntax(args[0], value)
    : new _Syntax(args[0], args[1]);
}

interface SyntaxPartiallyApplied<TC extends Base<any>> {
  (value: TC['_F']): Syntax<TC>;
}

export class _Syntax<TC extends Base<any>> {
  public constructor(public readonly TC: TC, public readonly value: TC['_F']) {}

  public equalsF<TC extends Eq<any>>(
    this: Syntax<TC>,
    that: TC['_F'],
  ): boolean {
    return this.TC.equals(this.value, that);
  }
  public equals<TC extends Eq<any>>(
    this: Syntax<TC>,
    that: Syntax<TC>,
  ): boolean {
    return this.equalsF(that.value);
  }
  public '==='<TC extends Eq<any>>(
    this: Syntax<TC>,
    that: TC['_F'] | Syntax<TC>,
  ): boolean {
    return that instanceof Syntax ? this.equals(that) : this.equalsF(that);
  }

  public notEqualsF<TC extends Eq<any>>(
    this: Syntax<TC>,
    that: TC['_F'],
  ): boolean {
    return this.TC.notEquals(this.value, that);
  }
  public notEquals<TC extends Eq<any>>(
    this: Syntax<TC>,
    that: Syntax<TC>,
  ): boolean {
    return this.notEqualsF(that.value);
  }
  public '!=='<TC extends Eq<any>>(
    this: Syntax<TC>,
    that: TC['_F'] | Syntax<TC>,
  ): boolean {
    return that instanceof Syntax
      ? this.notEquals(that)
      : this.notEqualsF(that);
  }

  public compareF<TC extends Ord<any>>(
    this: Syntax<TC>,
    that: TC['_F'],
  ): Compare {
    return this.TC.compare(this.value, that);
  }
  public compare<TC extends Ord<any>>(
    this: Syntax<TC>,
    that: Syntax<TC>,
  ): Compare {
    return this.compareF(that.value);
  }

  public ltF<TC extends Ord<any>>(this: Syntax<TC>, that: TC['_F']): boolean {
    return this.TC.lt(this.value, that);
  }
  public lt<TC extends Ord<any>>(this: Syntax<TC>, that: Syntax<TC>): boolean {
    return this.lt(that.value);
  }
  public '<'<TC extends Ord<any>>(
    this: Syntax<TC>,
    that: TC['_F'] | Syntax<TC>,
  ): boolean {
    return that instanceof Syntax ? this.lt(that) : this.ltF(that);
  }
  public lteF<TC extends Ord<any>>(this: Syntax<TC>, that: TC['_F']): boolean {
    return this.TC.lte(this.value, that);
  }
  public lte<TC extends Ord<any>>(this: Syntax<TC>, that: Syntax<TC>): boolean {
    return this.lte(that.value);
  }
  public '<='<TC extends Ord<any>>(
    this: Syntax<TC>,
    that: TC['_F'] | Syntax<TC>,
  ): boolean {
    return that instanceof Syntax ? this.lte(that) : this.ltF(that);
  }

  public gtF<TC extends Ord<any>>(this: Syntax<TC>, that: TC['_F']): boolean {
    return this.TC.gt(this.value, that);
  }
  public gt<TC extends Ord<any>>(this: Syntax<TC>, that: Syntax<TC>): boolean {
    return this.gt(that.value);
  }
  public '>'<TC extends Ord<any>>(
    this: Syntax<TC>,
    that: TC['_F'] | Syntax<TC>,
  ): boolean {
    return that instanceof Syntax ? this.gt(that) : this.ltF(that);
  }

  public gteF<TC extends Ord<any>>(this: Syntax<TC>, that: TC['_F']): boolean {
    return this.TC.gte(this.value, that);
  }
  public gte<TC extends Ord<any>>(this: Syntax<TC>, that: Syntax<TC>): boolean {
    return this.gte(that.value);
  }
  public '>='<TC extends Ord<any>>(
    this: Syntax<TC>,
    that: TC['_F'] | Syntax<TC>,
  ): boolean {
    return that instanceof Syntax ? this.gte(that) : this.ltF(that);
  }

  public combineF<TC extends Semigroup<any>>(
    this: Syntax<TC>,
    that: Lazy<TC['_F']>,
  ): Syntax<TC> {
    return new _Syntax(this.TC, this.TC.combine_(this.value, that));
  }
  public combine<TC extends Semigroup<any>>(
    this: Syntax<TC>,
    that: Lazy<TC['_F']>,
  ): Syntax<TC> {
    return this.combineF(() => that().value);
  }
}
