// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, PrimitiveType } from '@fp4ts/core';
import { Monoid } from '../../../monoid';
import { MonoidK } from '../../../monoid-k';
import { Ord } from '../../../ord';
import { Show } from '../../../show';
import { Applicative } from '../../../applicative';

import { Option } from '../../option';
import { List } from '../list';

import { Map } from './algebra';
import {
  all_,
  any_,
  collect_,
  contains_,
  count_,
  difference_,
  filter_,
  foldLeft1_,
  foldLeft_,
  foldMapK_,
  foldMap_,
  foldRight1_,
  foldRight_,
  forEach_,
  get_,
  head,
  headOption,
  init,
  insertWith_,
  insert_,
  intersectWith_,
  intersect_,
  isEmpty,
  last,
  lastOption,
  lookup_,
  map_,
  max,
  maxWithKey,
  min,
  minWithKey,
  nonEmpty,
  popMax,
  popMaxWithKey,
  popMin,
  popMinWithKey,
  remove_,
  show_,
  symmetricDifference_,
  tail,
  toArray,
  toList,
  traverse_,
  unionWith_,
  union_,
  update_,
} from './operators';

declare module './algebra' {
  interface Map<K, V> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly head: V;
    readonly headOption: Option<V>;

    readonly tail: Map<K, V>;
    readonly init: Map<K, V>;

    readonly last: V;
    readonly lastOption: V;

    readonly toArray: [K, V][];
    readonly toList: List<[K, V]>;

    count(p: (v: V, k: K) => boolean): number;
    all(p: (v: V, k: K) => boolean): boolean;
    any(p: (v: V, k: K) => boolean): boolean;

    readonly min: Option<V>;
    readonly minWithKey: Option<[K, V]>;
    readonly max: Option<V>;
    readonly maxWithKey: Option<[K, V]>;

    readonly popMin: Option<[V, Map<K, V>]>;
    readonly popMinWithKey: Option<[[K, V], Map<K, V>]>;
    readonly popMax: Option<[V, Map<K, V>]>;
    readonly popMaxWithKey: Option<[[K, V], Map<K, V>]>;

    contains<K2 extends PrimitiveType>(this: Map<K2, V>, k: K2): boolean;
    contains<K2>(this: Map<K2, V>, O: Ord<K2>, k: K2): boolean;

    get<K2 extends PrimitiveType>(this: Map<K2, V>, k: K2): V;
    get<K2>(this: Map<K2, V>, O: Ord<K2>, k: K2): V;
    '!!'<K2 extends PrimitiveType>(this: Map<K2, V>, k: K2): V;
    '!!'<K2>(this: Map<K2, V>, O: Ord<K2>, k: K2): V;

    lookup<K2 extends PrimitiveType>(this: Map<K2, V>, k: K2): Option<V>;
    lookup<K2>(this: Map<K2, V>, O: Ord<K2>, k: K2): Option<V>;
    '!?'<K2 extends PrimitiveType>(this: Map<K2, V>, k: K2): Option<V>;
    '!?'<K2>(this: Map<K2, V>, O: Ord<K2>, k: K2): Option<V>;

    insert<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      k: K2,
      v: V2,
    ): Map<K2, V2>;
    insert<K2, V2>(this: Map<K2, V2>, O: Ord<K2>, k: K2, v: V2): Map<K2, V2>;

    insertWith<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      k: K2,
      v: V2,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): Map<K2, V2>;
    insertWith<K2, V2>(
      this: Map<K2, V2>,
      O: Ord<K2>,
      k: K2,
      v: V2,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): Map<K2, V2>;

    remove<K2 extends PrimitiveType>(this: Map<K2, V>, k: K2): Map<K2, V>;
    remove<K2>(this: Map<K2, V>, O: Ord<K2>, k: K2): Map<K2, V>;

    update<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      k: K2,
      u: (v: V2, k: K2) => V2,
    ): Map<K2, V2>;
    update<K2, V2>(
      this: Map<K2, V2>,
      O: Ord<K2>,
      k: K2,
      u: (v: V2, k: K2) => V2,
    ): Map<K2, V2>;

    '+++'<K2, V2>(this: Map<K2, V2>, O: Ord<K2>, m2: Map<K2, V2>): Map<K2, V2>;
    '+++'<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      m2: Map<K2, V2>,
    ): Map<K2, V2>;
    union<K2, V2>(this: Map<K2, V2>, O: Ord<K2>, m2: Map<K2, V2>): Map<K2, V2>;
    union<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      m2: Map<K2, V2>,
    ): Map<K2, V2>;

    unionWith<K2, V2>(
      this: Map<K2, V2>,
      O: Ord<K2>,
      m2: Map<K2, V2>,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): Map<K2, V2>;
    unionWith<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      m2: Map<K2, V2>,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): Map<K2, V2>;

    intersect<K2, V2>(
      this: Map<K2, V>,
      O: Ord<K2>,
      m2: Map<K2, V2>,
    ): Map<K2, V>;
    intersect<K2 extends PrimitiveType, V2>(
      this: Map<K2, V>,
      m2: Map<K2, V2>,
    ): Map<K2, V>;

    intersectWith<K2, V2, C>(
      this: Map<K2, V>,
      O: Ord<K2>,
      m2: Map<K2, V2>,
      f: (v1: V, v2: V2, k: K2) => C,
    ): Map<K2, C>;
    intersectWith<K2 extends PrimitiveType, V2, C>(
      this: Map<K2, V>,
      m2: Map<K2, V2>,
      f: (v1: V, v2: V2, k: K2) => C,
    ): Map<K2, C>;

    '\\'<K2, V2>(this: Map<K2, V>, O: Ord<K2>, m2: Map<K2, V2>): Map<K2, V>;
    '\\'<K2 extends PrimitiveType, V2>(
      this: Map<K2, V>,
      m2: Map<K2, V2>,
    ): Map<K2, V>;
    difference<K2, V2>(
      this: Map<K2, V>,
      O: Ord<K2>,
      m2: Map<K2, V2>,
    ): Map<K2, V>;
    difference<K2 extends PrimitiveType, V2>(
      this: Map<K2, V>,
      m2: Map<K2, V2>,
    ): Map<K2, V>;

    '\\//'<K2, V2>(this: Map<K2, V2>, O: Ord<K2>, m2: Map<K2, V2>): Map<K2, V2>;
    '\\//'<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      m2: Map<K2, V2>,
    ): Map<K2, V2>;
    symmetricDifference<K2, V2>(
      this: Map<K2, V2>,
      O: Ord<K2>,
      m2: Map<K2, V2>,
    ): Map<K2, V2>;
    symmetricDifference<K2 extends PrimitiveType, V2>(
      this: Map<K2, V2>,
      m2: Map<K2, V2>,
    ): Map<K2, V2>;

    filter(p: (v: V, k: K) => boolean): Map<K, V>;
    map<B>(f: (v: V, k: K) => B): Map<K, B>;

    collect<B>(f: (v: V, k: K) => Option<B>): Map<K, B>;

    forEach(f: (v: V, k: K) => void): void;

    foldLeft<B>(z: B, f: (b: B, v: V, k: K) => B): B;
    foldLeft1<V2>(this: Map<K, V2>, f: (r: V2, v: V2) => V2): V2;
    foldRight<B>(z: B, f: (v: V, b: B, k: K) => B): B;
    foldRight1<V2>(this: Map<K, V2>, f: (v: V2, r: V2) => V2): V2;

    foldMap<M>(M: Monoid<M>): (f: (v: V, k: K) => M) => M;
    foldMapK<F>(
      F: MonoidK<F>,
    ): <B>(f: (v: V, k: K) => Kind<F, [B]>) => Kind<F, [B]>;

    traverse<G>(
      G: Applicative<G>,
    ): <B>(f: (v: V, k: K) => Kind<G, [B]>) => Kind<G, [Map<K, B>]>;

    show(this: Map<K, V>): string;
    show<K2 extends PrimitiveType>(this: Map<K2, V>, SV: Show<V>): string;
    show(this: Map<K, V>, SK: Show<K>, SV: Show<V>): string;
  }
}

Object.defineProperty(Map.prototype, 'isEmpty', {
  get<K, V>(this: Map<K, V>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Map.prototype, 'nonEmpty', {
  get<K, V>(this: Map<K, V>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Map.prototype, 'head', {
  get<K, V>(this: Map<K, V>): V {
    return head(this);
  },
});

Object.defineProperty(Map.prototype, 'headOption', {
  get<K, V>(this: Map<K, V>): Option<V> {
    return headOption(this);
  },
});

Object.defineProperty(Map.prototype, 'tail', {
  get<K, V>(this: Map<K, V>): Map<K, V> {
    return tail(this);
  },
});

Object.defineProperty(Map.prototype, 'init', {
  get<K, V>(this: Map<K, V>): Map<K, V> {
    return init(this);
  },
});

Object.defineProperty(Map.prototype, 'last', {
  get<K, V>(this: Map<K, V>): V {
    return last(this);
  },
});

Object.defineProperty(Map.prototype, 'lastOption', {
  get<K, V>(this: Map<K, V>): Option<V> {
    return lastOption(this);
  },
});

Object.defineProperty(Map.prototype, 'toList', {
  get<K, V>(this: Map<K, V>): List<[K, V]> {
    return toList(this);
  },
});

Object.defineProperty(Map.prototype, 'toArray', {
  get<K, V>(this: Map<K, V>): [K, V][] {
    return toArray(this);
  },
});

Map.prototype.count = function <K, V>(
  this: Map<K, V>,
  p: (v: V, k: K) => boolean,
): number {
  return count_(this, p);
};

Map.prototype.all = function <K, V>(
  this: Map<K, V>,
  p: (v: V, k: K) => boolean,
): boolean {
  return all_(this, p);
};

Map.prototype.any = function <K, V>(
  this: Map<K, V>,
  p: (v: V, k: K) => boolean,
): boolean {
  return any_(this, p);
};

Object.defineProperty(Map.prototype, 'min', {
  get<K, V>(this: Map<K, V>): Option<V> {
    return min(this);
  },
});

Object.defineProperty(Map.prototype, 'minWithKey', {
  get<K, V>(this: Map<K, V>): Option<[K, V]> {
    return minWithKey(this);
  },
});

Object.defineProperty(Map.prototype, 'max', {
  get<K, V>(this: Map<K, V>): Option<V> {
    return max(this);
  },
});

Object.defineProperty(Map.prototype, 'maxWithKey', {
  get<K, V>(this: Map<K, V>): Option<[K, V]> {
    return maxWithKey(this);
  },
});

Object.defineProperty(Map.prototype, 'popMin', {
  get<K, V>(this: Map<K, V>): Option<[V, Map<K, V>]> {
    return popMin(this);
  },
});
Object.defineProperty(Map.prototype, 'popMinWithKey', {
  get<K, V>(this: Map<K, V>): Option<[[K, V], Map<K, V>]> {
    return popMinWithKey(this);
  },
});

Object.defineProperty(Map.prototype, 'popMax', {
  get<K, V>(this: Map<K, V>): Option<[V, Map<K, V>]> {
    return popMax(this);
  },
});
Object.defineProperty(Map.prototype, 'popMaxWithKey', {
  get<K, V>(this: Map<K, V>): Option<[[K, V], Map<K, V>]> {
    return popMaxWithKey(this);
  },
});

Map.prototype.contains = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? contains_(args[0], this, args[1])
    : contains_(Ord.primitive, this, args[0]);
};

Map.prototype.get = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? get_(args[0], this, args[1])
    : get_(Ord.primitive, this, args[0]);
};
Map.prototype['!!'] = Map.prototype.get;

Map.prototype.lookup = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? lookup_(args[0], this, args[1])
    : lookup_(Ord.primitive, this, args[0]);
};
Map.prototype['!?'] = Map.prototype.lookup;

Map.prototype.insert = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? insert_(args[0], this, args[1], args[2])
    : insert_(Ord.primitive, this, args[0], args[1]);
};

Map.prototype.insertWith = function (this: any, ...args: any[]): any {
  return args.length === 4
    ? insertWith_(args[0], this, args[1], args[2], args[3])
    : insertWith_(Ord.primitive, this, args[0], args[1], args[2]);
};

Map.prototype.remove = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? remove_(args[0], this, args[1])
    : remove_(Ord.primitive, this, args[0]);
};

Map.prototype.update = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? update_(args[0], this, args[1], args[2])
    : update_(Ord.primitive, this, args[0], args[1]);
};

Map.prototype.union = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? union_(args[0], this, args[1])
    : union_(Ord.primitive, this, args[0]);
};

Map.prototype['+++'] = Map.prototype.union;

Map.prototype.unionWith = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? unionWith_(args[0], this, args[1], args[2])
    : unionWith_(Ord.primitive, this, args[0], args[1]);
};

Map.prototype.intersect = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? intersect_(args[0], this, args[1])
    : intersect_(Ord.primitive, this, args[0]);
};

Map.prototype.intersectWith = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? intersectWith_(args[0], this, args[1], args[2])
    : intersectWith_(Ord.primitive, this, args[0], args[1]);
};

Map.prototype.difference = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? difference_(args[0], this, args[1])
    : difference_(Ord.primitive, this, args[0]);
};
Map.prototype['\\'] = Map.prototype.difference;

Map.prototype.symmetricDifference = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? symmetricDifference_(args[0], this, args[1])
    : symmetricDifference_(Ord.primitive, this, args[0]);
};
Map.prototype['\\//'] = Map.prototype.symmetricDifference;

Map.prototype.filter = function <K, V>(
  this: Map<K, V>,
  p: (v: V, k: K) => boolean,
): Map<K, V> {
  return filter_(this, p);
};

Map.prototype.map = function <K, V, B>(
  this: Map<K, V>,
  f: (v: V, k: K) => B,
): Map<K, B> {
  return map_(this, f);
};

Map.prototype.collect = function <K, V, B>(
  this: Map<K, V>,
  f: (v: V, k: K) => Option<B>,
): Map<K, B> {
  return collect_(this, f);
};

Map.prototype.forEach = function (f) {
  forEach_(this, f);
};

Map.prototype.foldLeft = function <K, V, B>(
  this: Map<K, V>,
  z: B,
  f: (b: B, v: V, k: K) => B,
): B {
  return foldLeft_(this, z, f);
};

Map.prototype.foldLeft1 = function <K, V>(
  this: Map<K, V>,
  f: (r: V, v: V) => V,
): V {
  return foldLeft1_(this, f);
};

Map.prototype.foldRight = function <K, V, B>(
  this: Map<K, V>,
  z: B,
  f: (v: V, b: B, k: K) => B,
): B {
  return foldRight_(this, z, f);
};

Map.prototype.foldRight1 = function <K, V>(
  this: Map<K, V>,
  f: (v: V, r: V) => V,
): V {
  return foldRight1_(this, f);
};

Map.prototype.foldMap = function <K, V, M>(
  this: Map<K, V>,
  M: Monoid<M>,
): (f: (v: V, k: K) => M) => M {
  return f => foldMap_(M)(this, f);
};

Map.prototype.foldMapK = function <F, K, V>(
  this: Map<K, V>,
  F: MonoidK<F>,
): <B>(f: (v: V, k: K) => Kind<F, [B]>) => Kind<F, [B]> {
  return f => foldMapK_(F)(this, f);
};

Map.prototype.traverse = function <G, K, V>(
  this: Map<K, V>,
  G: Applicative<G>,
): <B>(f: (v: V, k: K) => Kind<G, [B]>) => Kind<G, [Map<K, B>]> {
  return f => traverse_(G)(this, f);
};

Map.prototype.show = function (this: any, ...args: any[]): string {
  switch (args.length) {
    case 2:
      return show_(args[0], args[1], this);
    case 1:
      return show_(Show.fromToString(), args[0], this);
    default:
      return show_(Show.fromToString(), Show.fromToString(), this);
  }
};
