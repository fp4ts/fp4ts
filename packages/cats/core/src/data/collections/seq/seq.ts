import { Eq } from '../../../eq';
import { Option } from '../../option';

import { List } from '../list';
import { Vector } from '../vector';
import { Iterable } from '../iterable';
import {
  fromArray,
  fromIterator,
  fromList,
  fromVector,
  of,
  pure,
  singleton,
} from './constructors';

export interface Seq<A> extends Iterable<A> {
  readonly isEmpty: boolean;
  readonly nonEmpty: boolean;

  readonly head: A;
  readonly headOption: Option<A>;
  readonly tail: Seq<A>;

  readonly last: A;
  readonly lastOption: Option<A>;
  readonly init: Seq<A>;

  readonly popHead: Option<[A, Seq<A>]>;
  readonly popLast: Option<[A, Seq<A>]>;

  readonly size: number;

  readonly toArray: A[];
  readonly toVector: Vector<A>;
  readonly toList: List<A>;

  readonly iterator: Iterator<A>;
  readonly reverseIterator: Iterator<A>;
  [Symbol.iterator](): Iterator<A>;

  // readonly reverse: Seq<A>;

  equals<B>(this: Seq<B>, E: Eq<B>, xs: Seq<B>): boolean;
  notEquals<B>(this: Seq<B>, E: Eq<B>, xs: Seq<B>): boolean;

  concat<B>(this: Seq<B>, xs: Seq<B>): Seq<B>;
  '+++'<B>(this: Seq<B>, xs: Seq<B>): Seq<B>;

  all(p: (a: A) => boolean): boolean;
  any(p: (a: A) => boolean): boolean;
  count(p: (a: A) => boolean): number;

  take(n: number): Seq<A>;
  takeRight(n: number): Seq<A>;

  drop(n: number): Seq<A>;
  dropRight(n: number): Seq<A>;

  slice(from: number, until: number): Seq<A>;
  splitAt(idx: number): [Seq<A>, Seq<A>];

  filter(p: (a: A) => boolean): Seq<A>;
  collect<B>(f: (a: A) => Option<B>): Seq<B>;
  collectWhile<B>(f: (a: A) => Option<B>): Seq<B>;
  map<B>(f: (a: A) => B): Seq<B>;

  flatMapSeq<B>(f: (a: A) => Seq<B>): Seq<B>;

  readonly flattenSeq: A extends Seq<infer B> ? Seq<B> : never | unknown;

  // fold: <B>(onNil: () => B, onCons: (head: A, tail: Seq<A>) => B) => B;
  // foldLeft: <B>(z: B, f: (b: B, a: A) => B) => B;
  // foldLeft1: <B>(this: Seq<B>, f: (x: B, a: B) => B) => B;
  // foldRight: <B>(z: B, f: (a: A, b: B) => B) => B;
  // foldRight1: <B>(this: Seq<B>, f: (x: B, a: B) => B) => B;
  // foldMap: <M>(M: Monoid<M>) => (f: (a: A) => M) => M;
  // foldMapK: <F>(
  //   F: MonoidK<F>,
  // ) => <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]>;
  // align<B>(ys: Seq<B>): Seq<Ior<A, B>>;
  // zip: <B>(ys: Seq<B>) => Seq<[A, B]>;
  // zipWith: <B, C>(ys: Seq<B>, f: (a: A, b: B) => C) => Seq<C>;
  // readonly zipWithIndex: Seq<[A, number]>;
  // zipAll: <B, A2>(
  //   this: Seq<A2>,
  //   ys: Seq<B>,
  //   defaultL: () => A2,
  //   defaultR: () => B,
  // ) => Seq<[A2, B]>;
  // zipAllWith: <B, C, A2>(
  //   this: Seq<A2>,
  //   ys: Seq<B>,
  //   defaultL: () => A2,
  //   defaultR: () => B,
  //   f: (a: A2, b: B) => C,
  // ) => Seq<C>;
  // partition: <L, R>(f: (a: A) => Either<L, R>) => [Seq<L>, Seq<R>];
  // scanLeft: <B>(z: B, f: (b: B, a: A) => B) => Seq<B>;
  // scanLeft1: <B>(this: Seq<B>, f: (x: B, y: B) => B) => Seq<B>;
  // scanRight: <B>(z: B, f: (a: A, b: B) => B) => Seq<B>;
  // scanRight1: <B>(this: Seq<B>, f: (x: B, y: B) => B) => Seq<B>;
  // traverse: <G>(
  //   G: Applicative<G>,
  // ) => <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [Seq<B>]>;
  // sequence: A extends Kind<any, [infer B]>
  //   ? <G>(G: Applicative<G>) => Kind<G, [Seq<B>]>
  //   : never | unknown;
  // flatTraverse: <G>(
  //   G: Applicative<G>,
  // ) => <B>(f: (a: A) => Kind<G, [Seq<B>]>) => Kind<G, [Seq<B>]>;

  // show(this: Seq<A>, S?: Show<A>): string;
}

export const Seq: SeqObj = function (...xs: any[]) {
  return fromArray(xs);
} as any;

interface SeqObj {
  empty: Seq<never>;
  <A>(...xs: A[]): Seq<A>;
  pure<A>(x: A): Seq<A>;
  singleton<A>(x: A): Seq<A>;
  of<A>(...xs: A[]): Seq<A>;
  fromArray<A>(xs: A[]): Seq<A>;
  fromList<A>(xs: List<A>): Seq<A>;
  fromVector<A>(xs: Vector<A>): Seq<A>;
  fromIterator<A>(xs: Iterator<A>): Seq<A>;
}

Object.defineProperty(Seq, 'empty', {
  get(): Seq<never> {
    return Vector.empty;
  },
});
Object.defineProperty(Seq, 'pure', {
  get() {
    return pure;
  },
});
Object.defineProperty(Seq, 'singleton', {
  get() {
    return singleton;
  },
});
Object.defineProperty(Seq, 'of', {
  get() {
    return of;
  },
});
Object.defineProperty(Seq, 'fromArray', {
  get() {
    return fromArray;
  },
});
Object.defineProperty(Seq, 'fromList', {
  get() {
    return fromList;
  },
});
Object.defineProperty(Seq, 'fromVector', {
  get() {
    return fromVector;
  },
});
Object.defineProperty(Seq, 'fromIterator', {
  get() {
    return fromIterator;
  },
});
