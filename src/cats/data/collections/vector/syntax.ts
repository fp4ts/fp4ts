import { Option } from '../../option';
import { List } from '../list';

import { Vector } from './algebra';
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
  interface Vector<A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly head: A;
    readonly headOption: Option<A>;
    readonly tail: Vector<A>;

    readonly last: A;
    readonly lastOption: Option<A>;
    readonly init: Vector<A>;

    readonly popHead: Option<[A, Vector<A>]>;
    readonly popLast: Option<[A, Vector<A>]>;

    readonly toList: List<A>;
    readonly toArray: A[];

    prepend<B>(this: Vector<B>, b: B): Vector<B>;
    append<B>(this: Vector<B>, b: B): Vector<B>;

    concat<B>(this: Vector<B>, that: Vector<B>): Vector<B>;
    '+++'<B>(this: Vector<B>, that: Vector<B>): Vector<B>;

    foldLeft<B>(z: B, f: (b: B, a: A) => B): B;
    foldRight<B>(z: B, f: (b: B, a: A) => B): B;
  }
}

Object.defineProperty(Vector.prototype, 'isEmpty', {
  get<A>(this: Vector<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Vector.prototype, 'nonEmpty', {
  get<A>(this: Vector<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Vector.prototype, 'head', {
  get<A>(this: Vector<A>): A {
    return head(this);
  },
});

Object.defineProperty(Vector.prototype, 'headOption', {
  get<A>(this: Vector<A>): Option<A> {
    return headOption(this);
  },
});

Object.defineProperty(Vector.prototype, 'tail', {
  get<A>(this: Vector<A>): Vector<A> {
    return tail(this);
  },
});

Object.defineProperty(Vector.prototype, 'last', {
  get<A>(this: Vector<A>): A {
    return last(this);
  },
});

Object.defineProperty(Vector.prototype, 'lastOption', {
  get<A>(this: Vector<A>): Option<A> {
    return lastOption(this);
  },
});

Object.defineProperty(Vector.prototype, 'init', {
  get<A>(this: Vector<A>): Vector<A> {
    return init(this);
  },
});

Object.defineProperty(Vector.prototype, 'popHead', {
  get<A>(this: Vector<A>): Option<[A, Vector<A>]> {
    return popHead(this);
  },
});

Object.defineProperty(Vector.prototype, 'popLast', {
  get<A>(this: Vector<A>): Option<[A, Vector<A>]> {
    return popLast(this);
  },
});

Object.defineProperty(Vector.prototype, 'toList', {
  get<A>(this: Vector<A>): List<A> {
    return toList(this);
  },
});

Object.defineProperty(Vector.prototype, 'toArray', {
  get<A>(this: Vector<A>): A[] {
    return toArray(this);
  },
});

Vector.prototype.prepend = function (x) {
  return prepend_(this, x);
};

Vector.prototype.append = function (x) {
  return append_(this, x);
};

Vector.prototype.concat = function (that) {
  return concat_(this, that);
};
Vector.prototype['+++'] = Vector.prototype.concat;

Vector.prototype.foldLeft = function (z, f) {
  return foldLeft_(this, z, f);
};

Vector.prototype.foldRight = function (z, f) {
  return foldRight_(this, z, f);
};
