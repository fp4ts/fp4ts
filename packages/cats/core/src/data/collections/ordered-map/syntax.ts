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

import { OrderedMap } from './algebra';
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
  size,
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
  interface OrderedMap<K, V> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly head: V;
    readonly headOption: Option<V>;

    readonly tail: OrderedMap<K, V>;
    readonly init: OrderedMap<K, V>;

    readonly last: V;
    readonly lastOption: V;

    readonly size: number;

    readonly toArray: [K, V][];
    readonly toList: List<[K, V]>;

    count(p: (v: V, k: K) => boolean): number;
    all(p: (v: V, k: K) => boolean): boolean;
    any(p: (v: V, k: K) => boolean): boolean;

    readonly min: Option<V>;
    readonly minWithKey: Option<[K, V]>;
    readonly max: Option<V>;
    readonly maxWithKey: Option<[K, V]>;

    readonly popMin: Option<[V, OrderedMap<K, V>]>;
    readonly popMinWithKey: Option<[[K, V], OrderedMap<K, V>]>;
    readonly popMax: Option<[V, OrderedMap<K, V>]>;
    readonly popMaxWithKey: Option<[[K, V], OrderedMap<K, V>]>;

    contains<K2 extends PrimitiveType>(this: OrderedMap<K2, V>, k: K2): boolean;
    contains<K2>(this: OrderedMap<K2, V>, O: Ord<K2>, k: K2): boolean;

    get<K2 extends PrimitiveType>(this: OrderedMap<K2, V>, k: K2): V;
    get<K2>(this: OrderedMap<K2, V>, O: Ord<K2>, k: K2): V;
    '!!'<K2 extends PrimitiveType>(this: OrderedMap<K2, V>, k: K2): V;
    '!!'<K2>(this: OrderedMap<K2, V>, O: Ord<K2>, k: K2): V;

    lookup<K2 extends PrimitiveType>(this: OrderedMap<K2, V>, k: K2): Option<V>;
    lookup<K2>(this: OrderedMap<K2, V>, O: Ord<K2>, k: K2): Option<V>;
    '!?'<K2 extends PrimitiveType>(this: OrderedMap<K2, V>, k: K2): Option<V>;
    '!?'<K2>(this: OrderedMap<K2, V>, O: Ord<K2>, k: K2): Option<V>;

    insert<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      k: K2,
      v: V2,
    ): OrderedMap<K2, V2>;
    insert<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      k: K2,
      v: V2,
    ): OrderedMap<K2, V2>;

    insertWith<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      k: K2,
      v: V2,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): OrderedMap<K2, V2>;
    insertWith<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      k: K2,
      v: V2,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): OrderedMap<K2, V2>;

    remove<K2 extends PrimitiveType>(
      this: OrderedMap<K2, V>,
      k: K2,
    ): OrderedMap<K2, V>;
    remove<K2>(this: OrderedMap<K2, V>, O: Ord<K2>, k: K2): OrderedMap<K2, V>;

    update<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      k: K2,
      u: (v: V2, k: K2) => V2,
    ): OrderedMap<K2, V2>;
    update<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      k: K2,
      u: (v: V2, k: K2) => V2,
    ): OrderedMap<K2, V2>;

    '+++'<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;
    '+++'<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;
    union<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;
    union<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;

    unionWith<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): OrderedMap<K2, V2>;
    unionWith<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      m2: OrderedMap<K2, V2>,
      u: (v1: V2, v2: V2, k: K2) => V2,
    ): OrderedMap<K2, V2>;

    intersect<K2, V2>(
      this: OrderedMap<K2, V>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V>;
    intersect<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V>;

    intersectWith<K2, V2, C>(
      this: OrderedMap<K2, V>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
      f: (v1: V, v2: V2, k: K2) => C,
    ): OrderedMap<K2, C>;
    intersectWith<K2 extends PrimitiveType, V2, C>(
      this: OrderedMap<K2, V>,
      m2: OrderedMap<K2, V2>,
      f: (v1: V, v2: V2, k: K2) => C,
    ): OrderedMap<K2, C>;

    '\\'<K2, V2>(
      this: OrderedMap<K2, V>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V>;
    '\\'<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V>;
    difference<K2, V2>(
      this: OrderedMap<K2, V>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V>;
    difference<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V>;

    '\\//'<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;
    '\\//'<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;
    symmetricDifference<K2, V2>(
      this: OrderedMap<K2, V2>,
      O: Ord<K2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;
    symmetricDifference<K2 extends PrimitiveType, V2>(
      this: OrderedMap<K2, V2>,
      m2: OrderedMap<K2, V2>,
    ): OrderedMap<K2, V2>;

    filter(p: (v: V, k: K) => boolean): OrderedMap<K, V>;
    map<B>(f: (v: V, k: K) => B): OrderedMap<K, B>;

    collect<B>(f: (v: V, k: K) => Option<B>): OrderedMap<K, B>;

    foldLeft<B>(z: B, f: (b: B, v: V, k: K) => B): B;
    foldLeft1<V2>(this: OrderedMap<K, V2>, f: (r: V2, v: V2) => V2): V2;
    foldRight<B>(z: B, f: (v: V, b: B, k: K) => B): B;
    foldRight1<V2>(this: OrderedMap<K, V2>, f: (v: V2, r: V2) => V2): V2;

    foldMap<M>(M: Monoid<M>): (f: (v: V, k: K) => M) => M;
    foldMapK<F>(
      F: MonoidK<F>,
    ): <B>(f: (v: V, k: K) => Kind<F, [B]>) => Kind<F, [B]>;

    traverse<G>(
      G: Applicative<G>,
    ): <B>(f: (v: V, k: K) => Kind<G, [B]>) => Kind<G, [OrderedMap<K, B>]>;

    show(this: OrderedMap<K, V>): string;
    show<K2 extends PrimitiveType>(
      this: OrderedMap<K2, V>,
      SV: Show<V>,
    ): string;
    show(this: OrderedMap<K, V>, SK: Show<K>, SV: Show<V>): string;
  }
}

Object.defineProperty(OrderedMap.prototype, 'isEmpty', {
  get<K, V>(this: OrderedMap<K, V>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'nonEmpty', {
  get<K, V>(this: OrderedMap<K, V>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'head', {
  get<K, V>(this: OrderedMap<K, V>): V {
    return head(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'headOption', {
  get<K, V>(this: OrderedMap<K, V>): Option<V> {
    return headOption(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'tail', {
  get<K, V>(this: OrderedMap<K, V>): OrderedMap<K, V> {
    return tail(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'init', {
  get<K, V>(this: OrderedMap<K, V>): OrderedMap<K, V> {
    return init(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'last', {
  get<K, V>(this: OrderedMap<K, V>): V {
    return last(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'lastOption', {
  get<K, V>(this: OrderedMap<K, V>): Option<V> {
    return lastOption(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'size', {
  get<K, V>(this: OrderedMap<K, V>): number {
    return size(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'toList', {
  get<K, V>(this: OrderedMap<K, V>): List<[K, V]> {
    return toList(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'toArray', {
  get<K, V>(this: OrderedMap<K, V>): [K, V][] {
    return toArray(this);
  },
});

OrderedMap.prototype.count = function <K, V>(
  this: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): number {
  return count_(this, p);
};

OrderedMap.prototype.all = function <K, V>(
  this: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean {
  return all_(this, p);
};

OrderedMap.prototype.any = function <K, V>(
  this: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean {
  return any_(this, p);
};

Object.defineProperty(OrderedMap.prototype, 'min', {
  get<K, V>(this: OrderedMap<K, V>): Option<V> {
    return min(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'minWithKey', {
  get<K, V>(this: OrderedMap<K, V>): Option<[K, V]> {
    return minWithKey(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'max', {
  get<K, V>(this: OrderedMap<K, V>): Option<V> {
    return max(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'maxWithKey', {
  get<K, V>(this: OrderedMap<K, V>): Option<[K, V]> {
    return maxWithKey(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'popMin', {
  get<K, V>(this: OrderedMap<K, V>): Option<[V, OrderedMap<K, V>]> {
    return popMin(this);
  },
});
Object.defineProperty(OrderedMap.prototype, 'popMinWithKey', {
  get<K, V>(this: OrderedMap<K, V>): Option<[[K, V], OrderedMap<K, V>]> {
    return popMinWithKey(this);
  },
});

Object.defineProperty(OrderedMap.prototype, 'popMax', {
  get<K, V>(this: OrderedMap<K, V>): Option<[V, OrderedMap<K, V>]> {
    return popMax(this);
  },
});
Object.defineProperty(OrderedMap.prototype, 'popMaxWithKey', {
  get<K, V>(this: OrderedMap<K, V>): Option<[[K, V], OrderedMap<K, V>]> {
    return popMaxWithKey(this);
  },
});

OrderedMap.prototype.contains = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? contains_(args[0], this, args[1])
    : contains_(Ord.primitive, this, args[0]);
};

OrderedMap.prototype.get = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? get_(args[0], this, args[1])
    : get_(Ord.primitive, this, args[0]);
};
OrderedMap.prototype['!!'] = OrderedMap.prototype.get;

OrderedMap.prototype.lookup = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? lookup_(args[0], this, args[1])
    : lookup_(Ord.primitive, this, args[0]);
};
OrderedMap.prototype['!?'] = OrderedMap.prototype.lookup;

OrderedMap.prototype.insert = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? insert_(args[0], this, args[1], args[2])
    : insert_(Ord.primitive, this, args[0], args[1]);
};

OrderedMap.prototype.insertWith = function (this: any, ...args: any[]): any {
  return args.length === 4
    ? insertWith_(args[0], this, args[1], args[2], args[3])
    : insertWith_(Ord.primitive, this, args[0], args[1], args[2]);
};

OrderedMap.prototype.remove = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? remove_(args[0], this, args[1])
    : remove_(Ord.primitive, this, args[0]);
};

OrderedMap.prototype.update = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? update_(args[0], this, args[1], args[2])
    : update_(Ord.primitive, this, args[0], args[1]);
};

OrderedMap.prototype.union = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? union_(args[0], this, args[1])
    : union_(Ord.primitive, this, args[0]);
};

OrderedMap.prototype['+++'] = OrderedMap.prototype.union;

OrderedMap.prototype.unionWith = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? unionWith_(args[0], this, args[1], args[2])
    : unionWith_(Ord.primitive, this, args[0], args[1]);
};

OrderedMap.prototype.intersect = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? intersect_(args[0], this, args[1])
    : intersect_(Ord.primitive, this, args[0]);
};

OrderedMap.prototype.intersectWith = function (this: any, ...args: any[]): any {
  return args.length === 3
    ? intersectWith_(args[0], this, args[1], args[2])
    : intersectWith_(Ord.primitive, this, args[0], args[1]);
};

OrderedMap.prototype.difference = function (this: any, ...args: any[]): any {
  return args.length === 2
    ? difference_(args[0], this, args[1])
    : difference_(Ord.primitive, this, args[0]);
};
OrderedMap.prototype['\\'] = OrderedMap.prototype.difference;

OrderedMap.prototype.symmetricDifference = function (
  this: any,
  ...args: any[]
): any {
  return args.length === 2
    ? symmetricDifference_(args[0], this, args[1])
    : symmetricDifference_(Ord.primitive, this, args[0]);
};
OrderedMap.prototype['\\//'] = OrderedMap.prototype.symmetricDifference;

OrderedMap.prototype.filter = function <K, V>(
  this: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): OrderedMap<K, V> {
  return filter_(this, p);
};

OrderedMap.prototype.map = function <K, V, B>(
  this: OrderedMap<K, V>,
  f: (v: V, k: K) => B,
): OrderedMap<K, B> {
  return map_(this, f);
};

OrderedMap.prototype.collect = function <K, V, B>(
  this: OrderedMap<K, V>,
  f: (v: V, k: K) => Option<B>,
): OrderedMap<K, B> {
  return collect_(this, f);
};

OrderedMap.prototype.foldLeft = function <K, V, B>(
  this: OrderedMap<K, V>,
  z: B,
  f: (b: B, v: V, k: K) => B,
): B {
  return foldLeft_(this, z, f);
};

OrderedMap.prototype.foldLeft1 = function <K, V>(
  this: OrderedMap<K, V>,
  f: (r: V, v: V) => V,
): V {
  return foldLeft1_(this, f);
};

OrderedMap.prototype.foldRight = function <K, V, B>(
  this: OrderedMap<K, V>,
  z: B,
  f: (v: V, b: B, k: K) => B,
): B {
  return foldRight_(this, z, f);
};

OrderedMap.prototype.foldRight1 = function <K, V>(
  this: OrderedMap<K, V>,
  f: (v: V, r: V) => V,
): V {
  return foldRight1_(this, f);
};

OrderedMap.prototype.foldMap = function <K, V, M>(
  this: OrderedMap<K, V>,
  M: Monoid<M>,
): (f: (v: V, k: K) => M) => M {
  return f => foldMap_(M)(this, f);
};

OrderedMap.prototype.foldMapK = function <F, K, V>(
  this: OrderedMap<K, V>,
  F: MonoidK<F>,
): <B>(f: (v: V, k: K) => Kind<F, [B]>) => Kind<F, [B]> {
  return f => foldMapK_(F)(this, f);
};

OrderedMap.prototype.traverse = function <G, K, V>(
  this: OrderedMap<K, V>,
  G: Applicative<G>,
): <B>(f: (v: V, k: K) => Kind<G, [B]>) => Kind<G, [OrderedMap<K, B>]> {
  return f => traverse_(G)(this, f);
};

OrderedMap.prototype.show = function (this: any, ...args: any[]): string {
  switch (args.length) {
    case 2:
      return show_(args[0], args[1], this);
    case 1:
      return show_(Show.fromToString(), args[0], this);
    default:
      return show_(Show.fromToString(), Show.fromToString(), this);
  }
};
