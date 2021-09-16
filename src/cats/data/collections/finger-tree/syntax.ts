import { Option } from '../../option';
import { List } from '../list';

import { FingerTree } from './algebra';
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
  interface FingerTree<A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: FingerTree<A>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: FingerTree<A>;

    readonly popHead: Option<[A, FingerTree<A>]>;
    readonly popLast: Option<[A, FingerTree<A>]>;

    readonly toList: List<A>;
    readonly toArray: A[];

    prepend<B>(this: FingerTree<B>, b: B): FingerTree<B>;
    append<B>(this: FingerTree<B>, b: B): FingerTree<B>;

    concat<B>(this: FingerTree<B>, that: FingerTree<B>): FingerTree<B>;
    '+++'<B>(this: FingerTree<B>, that: FingerTree<B>): FingerTree<B>;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldRight<B>(z: B, f: (b: B, a: A) => B): B;
  }
}

Object.defineProperty(FingerTree.prototype, 'isEmpty', {
  get<A>(this: FingerTree<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'nonEmpty', {
  get<A>(this: FingerTree<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'head', {
  get<A>(this: FingerTree<A>): A {
    return head(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'headOption', {
  get<A>(this: FingerTree<A>): Option<A> {
    return headOption(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'tail', {
  get<A>(this: FingerTree<A>): FingerTree<A> {
    return tail(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'last', {
  get<A>(this: FingerTree<A>): A {
    return last(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'lastOption', {
  get<A>(this: FingerTree<A>): Option<A> {
    return lastOption(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'init', {
  get<A>(this: FingerTree<A>): FingerTree<A> {
    return init(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'popHead', {
  get<A>(this: FingerTree<A>): Option<[A, FingerTree<A>]> {
    return popHead(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'popLast', {
  get<A>(this: FingerTree<A>): Option<[A, FingerTree<A>]> {
    return popLast(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'toList', {
  get<A>(this: FingerTree<A>): List<A> {
    return toList(this);
  },
});

Object.defineProperty(FingerTree.prototype, 'toArray', {
  get<A>(this: FingerTree<A>): A[] {
    return toArray(this);
  },
});

FingerTree.prototype.prepend = function (x) {
  return prepend_(this, x);
};

FingerTree.prototype.append = function (x) {
  return append_(this, x);
};

FingerTree.prototype.concat = function (that) {
  return concat_(this, that);
};
FingerTree.prototype['+++'] = FingerTree.prototype.concat;

FingerTree.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};

FingerTree.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};
