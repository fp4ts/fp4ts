import { Kind } from '@cats4ts/core';
import { Applicative } from '../../../applicative';

import { Option } from '../../option';
import { Vector } from '../vector';
import { List } from '../list';
import { Chain } from './algebra';
import {
  append_,
  collect_,
  concat_,
  foldLeft_,
  foldRight_,
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
  reversedIterator,
  size,
  tail,
  toArray,
  toList,
  toVector,
  traverse_,
  uncons,
  zipWithIndex,
  zipWith_,
} from './operators';

declare module './algebra' {
  interface Chain<A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: Chain<A>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: Chain<A>;

    readonly popHead: Option<[A, Chain<A>]>;
    readonly uncons: Option<[A, Chain<A>]>;

    readonly popLast: Option<[A, Chain<A>]>;

    readonly toArray: A[];
    readonly toVector: Vector<A>;
    readonly toList: List<A>;

    readonly size: number;

    prepend<B>(this: Chain<B>, x: B): Chain<B>;
    cons<B>(this: Chain<B>, x: B): Chain<B>;

    append<B>(this: Chain<B>, x: B): Chain<B>;
    snoc<B>(this: Chain<B>, x: B): Chain<B>;

    readonly iterator: Iterator<A>;
    readonly reversedIterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;

    concat<B>(this: Chain<B>, that: Chain<B>): Chain<B>;
    '+++'<B>(this: Chain<B>, that: Chain<B>): Chain<B>;

    collect<B>(f: (a: A) => Option<B>): Chain<B>;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldRight<B>(z: B, f: (a: A, b: B) => B): B;

    readonly zipWithIndex: Chain<[A, number]>;
    zipWith<B, C>(that: Chain<B>, f: (a: A, b: B) => C): Chain<C>;

    traverse<G>(
      G: Applicative<G>,
    ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Chain<B>]>;
  }
}

Object.defineProperty(Chain.prototype, 'isEmpty', {
  get<A>(this: Chain<A>): boolean {
    return isEmpty(this);
  },
});
Object.defineProperty(Chain.prototype, 'nonEmpty', {
  get<A>(this: Chain<A>): boolean {
    return nonEmpty(this);
  },
});
Object.defineProperty(Chain.prototype, 'head', {
  get<A>(this: Chain<A>): A {
    return head(this);
  },
});
Object.defineProperty(Chain.prototype, 'headOption', {
  get<A>(this: Chain<A>): Option<A> {
    return headOption(this);
  },
});
Object.defineProperty(Chain.prototype, 'tail', {
  get<A>(this: Chain<A>): Chain<A> {
    return tail(this);
  },
});
Object.defineProperty(Chain.prototype, 'last', {
  get<A>(this: Chain<A>): A {
    return last(this);
  },
});
Object.defineProperty(Chain.prototype, 'lastOption', {
  get<A>(this: Chain<A>): Option<A> {
    return lastOption(this);
  },
});
Object.defineProperty(Chain.prototype, 'init', {
  get<A>(this: Chain<A>): Chain<A> {
    return init(this);
  },
});
Object.defineProperty(Chain.prototype, 'popHead', {
  get<A>(this: Chain<A>): Option<[A, Chain<A>]> {
    return popHead(this);
  },
});
Object.defineProperty(Chain.prototype, 'uncons', {
  get<A>(this: Chain<A>): Option<[A, Chain<A>]> {
    return uncons(this);
  },
});
Object.defineProperty(Chain.prototype, 'popLast', {
  get<A>(this: Chain<A>): Option<[A, Chain<A>]> {
    return popLast(this);
  },
});
Object.defineProperty(Chain.prototype, 'toArray', {
  get<A>(this: Chain<A>): A[] {
    return toArray(this);
  },
});
Object.defineProperty(Chain.prototype, 'toVector', {
  get<A>(this: Chain<A>): Vector<A> {
    return toVector(this);
  },
});
Object.defineProperty(Chain.prototype, 'toList', {
  get<A>(this: Chain<A>): List<A> {
    return toList(this);
  },
});

Object.defineProperty(Chain.prototype, 'size', {
  get<A>(this: Chain<A>): number {
    return size(this);
  },
});

Chain.prototype.prepend = function (x) {
  return prepend_(this, x);
};
Chain.prototype.cons = Chain.prototype.prepend;

Chain.prototype.append = function (x) {
  return append_(this, x);
};
Chain.prototype.snoc = Chain.prototype.append;

Object.defineProperty(Chain.prototype, 'iterator', {
  get<A>(this: Chain<A>): Iterator<A> {
    return iterator(this);
  },
});
Object.defineProperty(Chain.prototype, 'reversedIterator', {
  get<A>(this: Chain<A>): Iterator<A> {
    return reversedIterator(this);
  },
});
Chain.prototype[Symbol.iterator] = function () {
  return iterator(this);
};

Chain.prototype.concat = function (that) {
  return concat_(this, that);
};
Chain.prototype['+++'] = Chain.prototype.concat;

Chain.prototype.collect = function (f) {
  return collect_(this, f);
};

Chain.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};
Chain.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};

Object.defineProperty(Chain.prototype, 'zipWithIndex', {
  get<A>(this: Chain<A>): Chain<[A, number]> {
    return zipWithIndex(this);
  },
});
Chain.prototype.zipWith = function (that, f) {
  return zipWith_(this, that)(f);
};

Chain.prototype.traverse = function (G) {
  return f => traverse_(G)(this, f);
};
