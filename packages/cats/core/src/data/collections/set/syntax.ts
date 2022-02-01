import { PrimitiveType } from '@fp4ts/core';
import { Ord } from '../../../ord';
import { List } from '../list';
import { Vector } from '../vector';

import {
  foldLeft_,
  foldRight_,
  insert_,
  remove_,
  toArray,
  toList,
  toVector,
  union_,
} from './operators';
import { Set } from './algebra';

declare module './algebra' {
  interface Set<A> {
    readonly toArray: A[];
    readonly toList: List<A>;
    readonly toVector: Vector<A>;

    insert<B extends PrimitiveType>(this: Set<B>, x: B): Set<B>;
    insert<B>(this: Set<B>, O: Ord<B>, x: B): Set<B>;

    remove<B extends PrimitiveType>(this: Set<B>, x: B): Set<B>;
    remove<B>(this: Set<B>, O: Ord<B>, x: B): Set<B>;

    union<B extends PrimitiveType>(this: Set<B>, sb: Set<B>): Set<B>;
    union<B>(this: Set<B>, O: Ord<B>, sb: Set<B>): Set<B>;

    foldLeft<B>(z: B, f: (b: B, x: A) => B): B;
    foldRight<B>(z: B, f: (x: A, b: B) => B): B;
  }
}

Object.defineProperty(Set.prototype, 'toArray', {
  get<A>(this: Set<A>) {
    return toArray(this);
  },
});

Object.defineProperty(Set.prototype, 'toList', {
  get<A>(this: Set<A>) {
    return toList(this);
  },
});

Object.defineProperty(Set.prototype, 'toVector', {
  get<A>(this: Set<A>) {
    return toVector(this);
  },
});

Set.prototype.insert = function (...args: any[]) {
  return args.length === 1
    ? insert_(Ord.primitive, this, args[0])
    : insert_(args[0], this, args[1]);
};

Set.prototype.remove = function (...args: any[]) {
  return args.length === 1
    ? remove_(Ord.primitive, this, args[0])
    : remove_(args[0], this, args[1]);
};

Set.prototype.union = function (...args: any[]) {
  return args.length === 1
    ? union_(Ord.primitive, this, args[0])
    : union_(args[0], this, args[1]);
};

Set.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};

Set.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};
