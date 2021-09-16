import { AnyK, Kind } from '../../../../core';
import { Option } from '../../option';
import { Show } from '../../../show';
import { Monoid } from '../../../monoid';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';
import { PrimitiveType } from '../../../../core/primitive-type';
import { Eq, primitiveEq } from '../../../eq';
import { Hashable, primitiveMD5Hashable } from '../../../hashable';
import { List } from '../list';
import { HashMap } from './algebra';
import {
  all_,
  any_,
  collect_,
  hasKey_,
  count_,
  difference_,
  filter_,
  flatMap_,
  flatten,
  foldLeft_,
  foldMapK_,
  foldMap_,
  foldRight_,
  insertWith_,
  insert_,
  intersectWith_,
  intersect_,
  isEmpty,
  keys,
  lookup_,
  map_,
  nonEmpty,
  remove_,
  show_,
  size,
  symmetricDifference_,
  tap_,
  toArray,
  toList,
  traverse_,
  unionWith_,
  union_,
  update_,
  values,
} from './operators';

declare module './algebra' {
  interface HashMap<K, V> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;
    readonly keys: List<K>;
    readonly values: List<V>;
    readonly size: number;
    readonly toList: List<[K, V]>;
    readonly toArray: Array<[K, V]>;

    count(p: (v: V, k: K) => boolean): number;

    any(p: (v: V, k: K) => boolean): boolean;
    all(p: (v: V, k: K) => boolean): boolean;

    hasKey<K2>(this: HashMap<K2, V>, H: Hashable<K2>, k: K2): boolean;
    hasKey<K2 extends PrimitiveType>(this: HashMap<K2, V>, k: K2): boolean;

    lookup<K2>(this: HashMap<K2, V>, H: Hashable<K2>, k: K2): Option<V>;
    lookup<K2 extends PrimitiveType>(this: HashMap<K2, V>, k: K2): Option<V>;

    insert<K2, V2>(
      this: HashMap<K2, V2>,
      H: Hashable<K2>,
      k: K2,
      v: V2,
    ): HashMap<K2, V2>;
    insert<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      k: K2,
      v: V2,
    ): HashMap<K2, V2>;

    insertWith<K2, V2>(
      this: HashMap<K2, V2>,
      H: Hashable<K2>,
      k: K2,
      v: V2,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): HashMap<K2, V2>;
    insertWith<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      k: K2,
      v: V2,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): HashMap<K2, V2>;

    remove<K2>(this: HashMap<K2, V>, H: Hashable<K2>, k: K2): HashMap<K2, V>;
    remove<K2 extends PrimitiveType>(
      this: HashMap<K2, V>,
      k: K2,
    ): HashMap<K2, V>;

    update<K2, V2>(
      this: HashMap<K2, V2>,
      H: Hashable<K2>,
      k: K2,
      u: (v: V2, k: K) => V2,
    ): HashMap<K2, V2>;
    update<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      k: K2,
      u: (v: V2, k: K) => V2,
    ): HashMap<K2, V2>;

    '+++'<K2, V2>(
      this: HashMap<K2, V2>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;
    '+++'<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;
    union<K2, V2>(
      this: HashMap<K2, V2>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;
    union<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;

    unionWith<K2, V2>(
      this: HashMap<K2, V2>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): HashMap<K2, V2>;
    unionWith<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      m2: HashMap<K2, V2>,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): HashMap<K2, V2>;

    intersect<K2, V2>(
      this: HashMap<K2, V>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V>;
    intersect<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V>;

    intersectWith<K2, V2, C>(
      this: HashMap<K2, V>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
      f: (v1: V, v2: V2, k: K2) => C,
    ): HashMap<K2, C>;
    intersectWith<K2 extends PrimitiveType, V2, C>(
      this: HashMap<K2, V>,
      m2: HashMap<K2, V2>,
      f: (v1: V, v2: V2, k: K2) => C,
    ): HashMap<K2, C>;

    '\\'<K2, V2>(
      this: HashMap<K2, V>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V>;
    '\\'<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V>;
    difference<K2, V2>(
      this: HashMap<K2, V>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V>;
    difference<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V>;

    '\\//'<K2, V2>(
      this: HashMap<K2, V2>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;
    '\\//'<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;
    symmetricDifference<K2, V2>(
      this: HashMap<K2, V2>,
      E: Eq<K2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;
    symmetricDifference<K2 extends PrimitiveType, V2>(
      this: HashMap<K2, V2>,
      m2: HashMap<K2, V2>,
    ): HashMap<K2, V2>;

    filter(p: (v: V, k: K) => boolean): HashMap<K, V>;

    map<B>(f: (v: V, k: K) => B): HashMap<K, B>;
    tap(f: (v: V, k: K) => unknown): HashMap<K, V>;

    collect<B>(f: (v: V, k: K) => Option<B>): HashMap<K, B>;

    flatMap<K2>(
      this: HashMap<K2, V>,
      E: Eq<K2>,
    ): <B>(f: (v: V, k: K) => HashMap<K2, B>) => HashMap<K2, B>;
    flatMap<K2 extends PrimitiveType, B>(
      this: HashMap<K2, V>,
      f: (v: V, k: K) => HashMap<K2, B>,
    ): HashMap<K2, B>;
    flatten: V extends HashMap<infer K2, infer B>
      ? K extends PrimitiveType
        ? (this: HashMap<K2, HashMap<K2, B>>) => HashMap<K2, B>
        : (this: HashMap<K2, HashMap<K2, B>>, E: Eq<K2>) => HashMap<K2, B>
      : never;

    foldLeft<B>(z: B, f: (b: B, v: V, k: K) => B): B;
    foldRight<B>(z: B, f: (v: V, b: B, k: K) => B): B;

    foldMap<M>(M: Monoid<M>): (f: (v: V, k: K) => M) => M;
    foldMapK<F extends AnyK>(
      F: MonoidK<F>,
    ): <B>(f: (v: V, k: K) => Kind<F, [B]>) => Kind<F, [B]>;

    traverse<G extends AnyK>(
      G: Applicative<G>,
    ): <B>(f: (v: V, k: K) => Kind<G, [B]>) => Kind<G, [HashMap<K, B>]>;

    show(this: HashMap<K, V>): string;
    show<K2 extends PrimitiveType>(this: HashMap<K2, V>, SV?: Show<V>): string;
    show(this: HashMap<K, V>, SK: Show<K>, SV: Show<V>): string;
  }
}

Object.defineProperty(HashMap.prototype, 'isEmpty', {
  get<K, V>(this: HashMap<K, V>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(HashMap.prototype, 'nonEmpty', {
  get<K, V>(this: HashMap<K, V>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(HashMap.prototype, 'keys', {
  get<K, V>(this: HashMap<K, V>): List<K> {
    return keys(this);
  },
});

Object.defineProperty(HashMap.prototype, 'values', {
  get<K, V>(this: HashMap<K, V>): List<V> {
    return values(this);
  },
});

Object.defineProperty(HashMap.prototype, 'size', {
  get<K, V>(this: HashMap<K, V>): number {
    return size(this);
  },
});

Object.defineProperty(HashMap.prototype, 'toList', {
  get<K, V>(this: HashMap<K, V>): List<[K, V]> {
    return toList(this);
  },
});

Object.defineProperty(HashMap.prototype, 'toArray', {
  get<K, V>(this: HashMap<K, V>): [K, V][] {
    return toArray(this);
  },
});

HashMap.prototype.count = function <K, V>(
  this: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): number {
  return count_(this, p);
};

HashMap.prototype.all = function <K, V>(
  this: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean {
  return all_(this, p);
};

HashMap.prototype.any = function <K, V>(
  this: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean {
  return any_(this, p);
};

HashMap.prototype.hasKey = function (this: any, ...args: any[]): boolean {
  return args.length === 2
    ? hasKey_(args[0], this, args[1])
    : hasKey_(primitiveMD5Hashable(), this, args[0]);
};

HashMap.prototype.lookup = function (
  this: any,
  ...args: any[]
): Option<unknown> {
  return args.length === 2
    ? lookup_(args[0], this, args[1])
    : lookup_(primitiveMD5Hashable(), this, args[0]);
};

HashMap.prototype.insert = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? insert_(args[0], this, args[1], args[2])
    : insert_(primitiveMD5Hashable(), this, args[0], args[1]);
};

HashMap.prototype.insertWith = function (this: any, ...args: any[]): any {
  return args.length === 4
    ? insertWith_(args[0], this, args[1], args[2], args[3])
    : insertWith_(primitiveMD5Hashable(), this, args[0], args[1], args[2]);
};

HashMap.prototype.update = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? update_(args[0], this, args[1], args[2])
    : update_(primitiveMD5Hashable(), this, args[0], args[1]);
};
HashMap.prototype.remove = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? remove_(args[0], this, args[1])
    : remove_(primitiveMD5Hashable(), this, args[0]);
};

HashMap.prototype.union = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? union_(args[0], this, args[1])
    : union_(primitiveMD5Hashable(), this, args[0]);
};

HashMap.prototype['+++'] = HashMap.prototype.union;

HashMap.prototype.unionWith = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? unionWith_(args[0], this, args[1], args[2])
    : unionWith_(primitiveMD5Hashable(), this, args[0], args[1]);
};

HashMap.prototype.intersect = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? intersect_(args[0], this, args[1])
    : intersect_(primitiveMD5Hashable(), this, args[0]);
};

HashMap.prototype.intersectWith = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? intersectWith_(args[0], this, args[1], args[2])
    : intersectWith_(primitiveMD5Hashable(), this, args[0], args[1]);
};

HashMap.prototype.difference = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? difference_(args[0], this, args[1])
    : difference_(primitiveEq(), this, args[0]);
};
HashMap.prototype['\\'] = HashMap.prototype.difference;

HashMap.prototype.symmetricDifference = function (
  this: any,
  ...args: any[]
): any {
  return args.length === 2
    ? symmetricDifference_(args[0], this, args[1])
    : symmetricDifference_(primitiveEq(), this, args[0]);
};
HashMap.prototype['\\//'] = HashMap.prototype.symmetricDifference;

HashMap.prototype.filter = function <K, V>(
  this: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): HashMap<K, V> {
  return filter_(this, p);
};

HashMap.prototype.map = function <K, V, B>(
  this: HashMap<K, V>,
  f: (v: V, k: K) => B,
): HashMap<K, B> {
  return map_(this, f);
};

HashMap.prototype.tap = function <K, V>(
  this: HashMap<K, V>,
  f: (v: V, k: K) => unknown,
): HashMap<K, V> {
  return tap_(this, f);
};

HashMap.prototype.collect = function <K, V, B>(
  this: HashMap<K, V>,
  f: (v: V, k: K) => Option<B>,
): HashMap<K, B> {
  return collect_(this, f);
};

HashMap.prototype.flatMap = function (this: any, ...args: any[]): any {
  return typeof args === 'function'
    ? (f: any) => flatMap_(args[0], this, f)
    : flatMap_(primitiveEq(), this, args[0]);
};

HashMap.prototype.flatten = function (this: any, ...args: any[]): any {
  return args.length === 1
    ? flatten(primitiveEq())(this)
    : flatten(args[0])(this);
};

HashMap.prototype.foldLeft = function <K, V, B>(
  this: HashMap<K, V>,
  z: B,
  f: (b: B, v: V, k: K) => B,
): B {
  return foldLeft_(this, z, f);
};

HashMap.prototype.foldRight = function <K, V, B>(
  this: HashMap<K, V>,
  z: B,
  f: (v: V, b: B, k: K) => B,
): B {
  return foldRight_(this, z, f);
};

HashMap.prototype.foldMap = function <K, V, M>(
  this: HashMap<K, V>,
  M: Monoid<M>,
): (f: (v: V, k: K) => M) => M {
  return f => foldMap_(M)(this, f);
};

HashMap.prototype.foldMapK = function <F extends AnyK, K, V>(
  this: HashMap<K, V>,
  F: MonoidK<F>,
): <B>(f: (v: V, k: K) => Kind<F, [B]>) => Kind<F, [B]> {
  return f => foldMapK_(F)(this, f);
};

HashMap.prototype.traverse = function <G extends AnyK, K, V>(
  this: HashMap<K, V>,
  G: Applicative<G>,
): <B>(f: (v: V, k: K) => Kind<G, [B]>) => Kind<G, [HashMap<K, B>]> {
  return f => traverse_(G)(this, f);
};

HashMap.prototype.show = function (this: any, ...args: any[]): string {
  switch (args.length) {
    case 2:
      return show_(args[0], args[1], this);
    case 1:
      return show_(Show.fromToString(), args[0], this);
    default:
      return show_(Show.fromToString(), Show.fromToString(), this);
  }
};
