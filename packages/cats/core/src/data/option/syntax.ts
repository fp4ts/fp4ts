import { PrimitiveType } from '@fp4ts/core';
import { Eq } from '../../eq';
import { List } from '../collections/list';
import { Option } from './algebra';
import {
  flatMap_,
  flatTap_,
  flatten,
  fold_,
  isEmpty,
  map_,
  nonEmpty,
  tap_,
  get,
  orElse_,
  getOrElse_,
  equals_,
  toList,
} from './operators';

declare module './algebra' {
  interface Option<A> {
    readonly get: A;
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly toList: List<A>;

    map<B>(f: (a: A) => B): Option<B>;
    tap(f: (a: A) => unknown): Option<A>;

    orElse<A2>(this: Option<A2>, that: () => Option<A2>): Option<A2>;
    '<|>'<A2>(this: Option<A2>, that: () => Option<A2>): Option<A2>;

    getOrElse<A2>(this: Option<A2>, defaultValue: () => A2): A2;

    flatMap<B>(f: (a: A) => Option<B>): Option<B>;
    flatTap(f: (a: A) => Option<unknown>): Option<A>;
    readonly flatten: A extends Option<infer B> ? Option<B> : never;

    fold<B1, B2 = B1>(onNone: () => B1, onSome: (a: A) => B2): B1 | B2;

    equals<B extends PrimitiveType>(this: Option<B>, that: Option<B>): boolean;
    equals<B>(this: Option<B>, E: Eq<B>, that: Option<B>): boolean;
  }
}

Object.defineProperty(Option.prototype, 'get', {
  get<A>(this: Option<A>): A {
    return get(this);
  },
});

Object.defineProperty(Option.prototype, 'isEmpty', {
  get<A>(this: Option<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Option.prototype, 'nonEmpty', {
  get<A>(this: Option<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Option.prototype, 'toList', {
  get<A>(this: Option<A>): List<A> {
    return toList(this);
  },
});

Option.prototype.map = function <A, B>(
  this: Option<A>,
  f: (a: A) => B,
): Option<B> {
  return map_(this, f);
};

Option.prototype.tap = function <A>(
  this: Option<A>,
  f: (a: A) => unknown,
): Option<A> {
  return tap_(this, f);
};

Option.prototype.orElse = function (that) {
  return orElse_(this, that);
};

Option.prototype['<|>'] = Option.prototype.orElse;

Option.prototype.getOrElse = function <A>(
  this: Option<A>,
  defaultValue: () => A,
): A {
  return getOrElse_(this, defaultValue);
};

Option.prototype.flatMap = function <A, B>(
  this: Option<A>,
  f: (a: A) => Option<B>,
): Option<B> {
  return flatMap_(this, f);
};

Option.prototype.flatTap = function <A>(
  this: Option<A>,
  f: (a: A) => Option<unknown>,
): Option<A> {
  return flatTap_(this, f);
};

Object.defineProperty(Option.prototype, 'flatten', {
  get<A>(this: Option<Option<A>>): Option<A> {
    return flatten(this);
  },
});

Option.prototype.fold = function (onNone, onSome) {
  return fold_(this, onNone, onSome);
};

Option.prototype.equals = function (...args: any[]): any {
  return args.length === 2
    ? equals_(args[0])(this, args[1])
    : equals_(Eq.primitive)(this, args[0]);
};
