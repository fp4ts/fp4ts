import { Option } from '../../option';
import { List } from '../list';

import { FingerTree } from './algebra';
import { Measured } from './measured';
import {
  append_,
  concat_,
  foldLeft_,
  foldRight_,
  head,
  headOption,
  init,
  isEmpty,
  last,
  lastOption,
  nonEmpty,
  popHead,
  popLast,
  prepend_,
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

    toList<B>(this: FingerTree<V, B>, M: Measured<B, V>): List<A>;
    toArray<B>(this: FingerTree<V, B>, M: Measured<B, V>): A[];

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

FingerTree.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};

FingerTree.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};
