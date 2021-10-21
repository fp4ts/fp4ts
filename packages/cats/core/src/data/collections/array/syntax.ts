import { Iter } from '@cats4ts/core';
import { Monoid } from '../../../monoid';
import { Some, None } from '../../option';
import { IndexedSeq } from '../indexed-seq';
import {
  concat_,
  drop_,
  foldLeft_,
  foldMap_,
  foldRight_,
  head,
  isEmpty,
  nonEmpty,
  tail,
  take_,
} from './operators';

declare global {
  interface Array<T> extends IndexedSeq<T> {
    head: T;
    tail: T[];

    isEmpty: boolean;
    nonEmpty: boolean;

    take(n: number): T[];
    drop(n: number): T[];

    '+++': <B = T>(ys: B[]) => Array<B>;
    concat<B = T>(ys: B[]): Array<B>;

    all: (p: (a: T) => boolean) => boolean;
    any: (p: (a: T) => boolean) => boolean;

    foldMap: <M>(M: Monoid<M>) => (f: (a: T) => M) => M;
    foldLeft: <B>(z: B, f: (b: B, a: T) => B) => B;
    foldRight: <B>(z: B, f: (a: T, b: B) => B) => B;
  }
}

Object.defineProperty(Array.prototype, 'head', {
  get<A>(this: A[]): A {
    return head(this);
  },
});

Object.defineProperty(Array.prototype, 'tail', {
  get<A>(this: A[]): A[] {
    return tail(this);
  },
});

Object.defineProperty(Array.prototype, 'isEmpty', {
  get<A>(this: A[]): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Array.prototype, 'nonEmpty', {
  get<A>(this: A[]): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Array.prototype, 'size', {
  get<A>(this: A[]): number {
    return this.length;
  },
});

Object.defineProperty(Array.prototype, 'iterator', {
  get<A>(this: A[]): Iterator<A> {
    return this[Symbol.iterator]();
  },
});

Object.defineProperty(Array.prototype, 'reverseIterator', {
  get<A>(this: A[]): Iterator<A> {
    let i = this.length - 1;
    return Iter.lift(() =>
      i >= 0 ? Iter.Result.pure(this[i--]) : Iter.Result.done,
    );
  },
});

Array.prototype.take = function <A>(this: A[], n: number): A[] {
  return take_(this, n);
};

Array.prototype.drop = function <A>(this: A[], n: number): A[] {
  return drop_(this, n);
};

Array.prototype['+++'] = function <A>(this: A[], that: A[]): Array<A> {
  return concat_(this, that);
};

Array.prototype.elem = function (idx) {
  return this[idx];
};
Array.prototype['!!'] = Array.prototype.elem;

Array.prototype.elemOption = function (idx) {
  return idx >= 0 && idx < this.length ? Some(this[idx]) : None;
};

Array.prototype.foldMap = function <A, M>(
  this: A[],
  M: Monoid<M>,
): (f: (a: A) => M) => M {
  return f => foldMap_(this, f, M);
};

Array.prototype.foldLeft = function <A, B>(
  this: A[],
  z: B,
  f: (b: B, a: A) => B,
): B {
  return foldLeft_(this, z, f);
};

Array.prototype.foldRight = function <A, B>(
  this: A[],
  z: B,
  f: (a: A, b: B) => B,
): B {
  return foldRight_(this, z, f);
};
