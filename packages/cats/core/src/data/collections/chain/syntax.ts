import { Kind } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { Applicative } from '../../../applicative';

import { Ior } from '../../ior';
import { Option } from '../../option';
import { Vector } from '../vector';
import { List } from '../list';
import { Chain } from './algebra';
import {
  align_,
  append_,
  collectWhile_,
  collect_,
  concat_,
  equals_,
  filter_,
  flatMap_,
  flatten,
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
  map_,
  nonEmpty,
  popHead,
  popLast,
  prepend_,
  reverse,
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
  zip_,
} from './operators';

declare module './algebra' {
  interface Chain<A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly size: number;

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
    readonly toList: List<A>;
    readonly toVector: Vector<A>;

    readonly iterator: Iterator<A>;
    readonly reverseIterator: Iterator<A>;
    [Symbol.iterator](): Iterator<A>;

    readonly reverse: Chain<A>;

    equals<B>(this: Chain<B>, E: Eq<B>, that: Chain<B>): boolean;
    notEquals<B>(this: Chain<B>, E: Eq<B>, that: Chain<B>): boolean;

    prepend<B>(this: Chain<B>, x: B): Chain<B>;
    cons<B>(this: Chain<B>, x: B): Chain<B>;
    '+::'<B>(this: Chain<B>, x: B): Chain<B>;

    append<B>(this: Chain<B>, x: B): Chain<B>;
    snoc<B>(this: Chain<B>, x: B): Chain<B>;
    '::+'<B>(this: Chain<B>, x: B): Chain<B>;

    concat<B>(this: Chain<B>, that: Chain<B>): Chain<B>;
    '+++'<B>(this: Chain<B>, that: Chain<B>): Chain<B>;

    filter(p: (a: A) => boolean): Chain<A>;
    collect<B>(f: (a: A) => Option<B>): Chain<B>;
    collectWhile<B>(f: (a: A) => Option<B>): Chain<B>;
    map<B>(f: (a: A) => B): Chain<B>;

    flatMap<B>(f: (a: A) => Chain<B>): Chain<B>;

    readonly flatten: A extends Chain<infer B> ? Chain<B> : never;

    align<B>(ys: Chain<B>): Chain<Ior<A, B>>;
    zip<B>(ys: Chain<B>): Chain<[A, B]>;
    zipWith<B, C>(that: Chain<B>, f: (a: A, b: B) => C): Chain<C>;

    readonly zipWithIndex: Chain<[A, number]>;

    forEach(f: (a: A) => void): void;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldRight<B>(z: B, f: (a: A, b: B) => B): B;

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

Object.defineProperty(Chain.prototype, 'reverse', {
  get<A>(this: Chain<A>): Chain<A> {
    return reverse(this);
  },
});

Chain.prototype.equals = function (E, that) {
  return equals_(E)(this, that);
};
Chain.prototype.notEquals = function (E, that) {
  return !equals_(E)(this, that);
};

Chain.prototype.prepend = function (x) {
  return prepend_(this, x);
};
Chain.prototype.cons = Chain.prototype.prepend;
Chain.prototype['+::'] = Chain.prototype.prepend;

Chain.prototype.append = function (x) {
  return append_(this, x);
};
Chain.prototype.snoc = Chain.prototype.append;
Chain.prototype['::+'] = Chain.prototype.append;

Chain.prototype.concat = function (that) {
  return concat_(this, that);
};
Chain.prototype['+++'] = Chain.prototype.concat;

Chain.prototype.filter = function (f) {
  return filter_(this, f);
};
Chain.prototype.collect = function (f) {
  return collect_(this, f);
};
Chain.prototype.collectWhile = function (f) {
  return collectWhile_(this, f);
};

Chain.prototype.map = function (f) {
  return map_(this, f);
};
Chain.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Chain.prototype, 'flatten', {
  get<A>(this: Chain<Chain<A>>) {
    return flatten(this);
  },
});

Chain.prototype.align = function (that) {
  return align_(this, that);
};
Chain.prototype.zip = function (that) {
  return zip_(this, that);
};
Object.defineProperty(Chain.prototype, 'zipWithIndex', {
  get<A>(this: Chain<A>): Chain<[A, number]> {
    return zipWithIndex(this);
  },
});
Chain.prototype.zipWith = function (that, f) {
  return zipWith_(this, that)(f);
};

Chain.prototype.forEach = function (f) {
  return forEach_(this, f);
};

Chain.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};
Chain.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};

Chain.prototype.traverse = function (G) {
  return f => traverse_(G)(this, f);
};
