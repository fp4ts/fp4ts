import { Monoid } from '../..';
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
  interface Array<T> {
    head: T;
    tail: T[];

    isEmpty: boolean;
    nonEmpty: boolean;

    take(n: number): T[];
    drop(n: number): T[];

    '+++': <B>(ys: B[]) => Array<T | B>;
    concat<B>(ys: B[]): Array<T | B>;

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

Array.prototype.take = function <A>(this: A[], n: number): A[] {
  return take_(this, n);
};

Array.prototype.drop = function <A>(this: A[], n: number): A[] {
  return drop_(this, n);
};

Array.prototype['+++'] = function <A, B>(this: A[], that: B[]): Array<A | B> {
  return concat_<A | B>(this, that);
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
