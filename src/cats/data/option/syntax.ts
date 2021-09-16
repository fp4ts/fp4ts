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
} from './operators';

declare module './algebra' {
  interface Option<A> {
    readonly get: A;
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    map<B>(f: (a: A) => B): Option<B>;
    tap(f: (a: A) => unknown): Option<A>;

    orElse<A2>(this: Option<A2>, that: Option<A2>): Option<A2>;
    '<|>'<A2>(this: Option<A2>, that: Option<A2>): Option<A2>;

    getOrElse<A2>(this: Option<A2>, defaultValue: () => A2): A2;

    flatMap<B>(f: (a: A) => Option<B>): Option<B>;
    flatTap(f: (a: A) => Option<unknown>): Option<A>;
    readonly flatten: A extends Option<infer B> ? Option<B> : never | unknown;

    fold<B>(onNone: () => B, onSome: (a: A) => B): B;
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

Option.prototype.orElse = function <A>(
  this: Option<A>,
  that: Option<A>,
): Option<A> {
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

Option.prototype.fold = function <A, B>(
  this: Option<A>,
  onNone: () => B,
  onSome: (a: A) => B,
): B {
  return fold_(this, onNone, onSome);
};
