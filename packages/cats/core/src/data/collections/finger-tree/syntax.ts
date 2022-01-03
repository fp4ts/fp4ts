// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '../../option';
import { List } from '../list';

import { FingerTree } from './algebra';
import { Measured } from './measured';
import {
  append_,
  concat_,
  foldLeft_,
  foldRight_,
  forEach_,
  head,
  headOption,
  init,
  isEmpty,
  iterator,
  last,
  lastOption,
  nonEmpty,
  popHead,
  popLast,
  prepend_,
  reverseIterator,
  splitAt_,
  tail,
  toArray,
  toList,
} from './operators';

declare module './algebra' {
  interface FingerTree<V, A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    head(M: Measured<A, V>): A;
    headOption(M: Measured<A, V>): Option<A>;
    tail(M: Measured<A, V>): FingerTree<V, A>;

    last(M: Measured<A, V>): A;
    lastOption(M: Measured<A, V>): Option<A>;
    init(M: Measured<A, V>): FingerTree<V, A>;

    popHead<B>(
      this: FingerTree<V, B>,
      M: Measured<B, V>,
    ): Option<[A, FingerTree<V, A>]>;
    popLast<B>(
      this: FingerTree<V, B>,
      M: Measured<B, V>,
    ): Option<[A, FingerTree<V, A>]>;

    readonly toList: List<A>;
    readonly toArray: A[];
    readonly iterator: Iterator<A>;
    readonly reverseIterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;

    prepend<B>(
      this: FingerTree<V, B>,
      M: Measured<A, V>,
    ): (b: B) => FingerTree<V, B>;
    append<B>(
      this: FingerTree<V, B>,
      M: Measured<A, V>,
    ): (b: B) => FingerTree<V, B>;

    concat<B>(
      this: FingerTree<V, B>,
      M: Measured<B, V>,
    ): (that: FingerTree<V, B>) => FingerTree<V, B>;

    splitAt(
      M: Measured<A, V>,
    ): (
      start: V,
      p: (v: V) => boolean,
    ) => Option<[FingerTree<V, A>, A, FingerTree<V, A>]>;

    forEach(f: (a: A) => void): void;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldRight<B>(z: B, f: (b: B, a: A) => B): B;
  }
}

Object.defineProperty(FingerTree.prototype, 'isEmpty', {
  get<V, A>(this: FingerTree<V, A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'nonEmpty', {
  get<V, A>(this: FingerTree<V, A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'head', {
  get<V, A>(this: FingerTree<V, A>): (M: Measured<A, V>) => A {
    return M => head(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'headOption', {
  get<V, A>(this: FingerTree<V, A>): (M: Measured<A, V>) => Option<A> {
    return M => headOption(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'tail', {
  get<V, A>(this: FingerTree<V, A>): (M: Measured<A, V>) => FingerTree<V, A> {
    return M => tail(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'last', {
  get<V, A>(this: FingerTree<V, A>): (M: Measured<A, V>) => A {
    return M => last(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'lastOption', {
  get<V, A>(this: FingerTree<V, A>): (M: Measured<A, V>) => Option<A> {
    return M => lastOption(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'init', {
  get<V, A>(this: FingerTree<V, A>): (M: Measured<A, V>) => FingerTree<V, A> {
    return M => init(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'popHead', {
  get<V, A>(
    this: FingerTree<V, A>,
  ): (M: Measured<A, V>) => Option<[A, FingerTree<V, A>]> {
    return M => popHead(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'popLast', {
  get<V, A>(
    this: FingerTree<V, A>,
  ): (M: Measured<A, V>) => Option<[A, FingerTree<V, A>]> {
    return M => popLast(M)(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'toList', {
  get<V, A>(this: FingerTree<V, A>): List<A> {
    return toList(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'toArray', {
  get<V, A>(this: FingerTree<V, A>): A[] {
    return toArray(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'iterator', {
  get<V, A>(this: FingerTree<V, A>) {
    return iterator(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'reverseIterator', {
  get<V, A>(this: FingerTree<V, A>) {
    return reverseIterator(this);
  },
});

FingerTree.prototype[Symbol.iterator] = function () {
  return iterator(this);
};

FingerTree.prototype.prepend = function <V, A>(
  this: FingerTree<V, A>,
  M: Measured<A, V>,
) {
  return (x: A) => prepend_(M)(this, x);
};

FingerTree.prototype.append = function <V, A>(
  this: FingerTree<V, A>,
  M: Measured<A, V>,
) {
  return (x: A) => append_(M)(this, x);
};

FingerTree.prototype.concat = function <V, A>(
  this: FingerTree<V, A>,
  M: Measured<A, V>,
) {
  return (that: FingerTree<V, A>) => concat_(M)(this, that);
};

FingerTree.prototype.splitAt = function <V, A>(
  this: FingerTree<V, A>,
  M: Measured<A, V>,
) {
  return (start: V, p: (v: V) => boolean) => splitAt_(M)(this, start, p);
};

FingerTree.prototype.forEach = function (f) {
  return forEach_(this, f);
};

FingerTree.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};

FingerTree.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};
