import { Kind, URIS } from '../../../core';
import { Applicative } from '../../applicative';
import { Eq } from '../../eq';
import { Show } from '../../show';
import { Monoid } from '../../monoid';
import { MonoidK } from '../../monoid-k';
import { Option } from '../option';
import { Either } from '../either';

import { List } from './algebra';
import {
  all_,
  any_,
  collectWhile_,
  collect_,
  concat_,
  count_,
  dropRight_,
  drop_,
  elem_,
  equals_,
  filter_,
  flatMap_,
  flatSequence,
  flatten,
  flatTraverse_,
  foldLeft1_,
  foldLeft_,
  foldMapK_,
  foldMap_,
  foldRight1_,
  foldRight_,
  fold_,
  head,
  headOption,
  init,
  isEmpty,
  last,
  lastOption,
  map_,
  nonEmpty,
  notEquals_,
  partition_,
  prepend_,
  reverse,
  scanLeft1_,
  scanLeft_,
  scanRight1_,
  scanRight_,
  sequence,
  show_,
  size,
  slice_,
  splitAt_,
  tail,
  takeRight_,
  take_,
  toArray,
  traverse_,
  uncons,
  zipPad_,
  zipWithIndex,
  zipWithPad_,
  zipWith_,
  zip_,
} from './operators';

declare module './algebra' {
  interface List<A> {
    readonly head: A;
    readonly headOption: A;
    readonly tail: List<A>;
    readonly init: List<A>;
    readonly last: A;
    readonly lastOption: A;
    readonly uncons: Option<[A, List<A>]>;
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;
    readonly size: number;
    readonly toArray: A[];
    readonly reverse: List<A>;
    equals<B>(this: List<B>, E: Eq<B>, xs: List<B>): boolean;
    notEquals<B>(this: List<B>, E: Eq<B>, xs: List<B>): boolean;
    prepend<B>(this: List<B>, x: B): List<B>;
    concat<B>(this: List<B>, xs: List<B>): List<B>;
    '+++'<B>(this: List<B>, xs: List<B>): List<B>;
    elem(idx: number): A;
    all(p: (a: A) => boolean): boolean;
    any(p: (a: A) => boolean): boolean;
    count(p: (a: A) => boolean): number;
    take(n: number): List<A>;
    takeRight(n: number): List<A>;
    drop(n: number): List<A>;
    dropRight(n: number): List<A>;
    slice(from: number, until: number): List<A>;
    splitAt(idx: number): [List<A>, List<A>];
    filter: (p: (a: A) => boolean) => List<A>;
    map: <B>(f: (a: A) => B) => List<B>;
    flatMap: <B>(f: (a: A) => List<B>) => List<B>;
    readonly flatten: A extends List<infer B> ? List<B> : never | unknown;
    fold: <B>(onNil: () => B, onCons: (head: A, tail: List<A>) => B) => B;
    foldLeft: <B>(z: B, f: (b: B, a: A) => B) => B;
    foldLeft1: <B = A>(f: (x: B, a: B) => B) => B;
    foldRight: <B>(z: B, f: (a: A, b: B) => B) => B;
    foldRight1: <B>(this: List<B>, f: (x: B, a: B) => B) => B;
    foldMap: <M>(M: Monoid<M>) => (f: (a: A) => M) => M;
    foldMapK: <F extends URIS>(
      F: MonoidK<F>,
    ) => <C, S, R, E, B>(
      f: (a: A) => Kind<F, C, S, R, E, B>,
    ) => Kind<F, C, S, R, E, B>;
    zip: <B>(ys: List<B>) => List<[A, B]>;
    zipWith: <B, C>(ys: List<B>, f: (a: A, b: B) => C) => List<C>;
    readonly zipWithIndex: List<[A, number]>;
    zipPad: <B, A2>(
      this: List<A2>,
      ys: List<B>,
      defaultL: () => A2,
      defaultR: () => B,
    ) => List<[A2, B]>;
    zipWithPad: <B, C, A2>(
      this: List<A2>,
      ys: List<B>,
      defaultL: () => A2,
      defaultR: () => B,
      f: (a: A2, b: B) => C,
    ) => List<C>;
    collect: <B>(f: (a: A) => Option<B>) => List<B>;
    collectWhile: <B>(f: (a: A) => Option<B>) => List<B>;
    partition: <L, R>(f: (a: A) => Either<L, R>) => [List<L>, List<R>];
    scanLeft: <B>(z: B, f: (b: B, a: A) => B) => List<B>;
    scanLeft1: <B>(this: List<B>, f: (x: B, y: B) => B) => List<B>;
    scanRight: <B>(z: B, f: (a: A, b: B) => B) => List<B>;
    scanRight1: <B>(this: List<B>, f: (x: B, y: B) => B) => List<B>;
    traverse: <G extends URIS>(
      G: Applicative<G>,
    ) => <B, C, S, R, E>(
      f: (a: A) => Kind<G, C, S, R, E, B>,
    ) => Kind<G, C, S, R, E, List<B>>;
    sequence: A extends Kind<
      unknown,
      infer C,
      infer S,
      infer R,
      infer E,
      infer B
    >
      ? <G extends URIS, C, S, R, E>(
          G: Applicative<G>,
        ) => Kind<G, C, S, R, E, List<B>>
      : never | unknown;
    flatTraverse: <G extends URIS, C, S, R, E>(
      G: Applicative<G>,
    ) => <B>(
      f: (a: A) => Kind<G, C, S, R, E, List<B>>,
    ) => Kind<G, C, S, R, E, List<B>>;
    flatSequence: A extends Kind<
      unknown,
      infer C,
      infer R,
      infer S,
      infer E,
      List<infer B>
    >
      ? <G extends URIS>(G: Applicative<G>) => Kind<G, C, S, R, E, List<B>>
      : never | unknown;

    show(this: List<A>, S?: Show<A>): string;
  }
}

Object.defineProperty(List.prototype, 'head', {
  get<A>(this: List<A>): A {
    return head(this);
  },
});

Object.defineProperty(List.prototype, 'headOption', {
  get<A>(this: List<A>): Option<A> {
    return headOption(this);
  },
});

Object.defineProperty(List.prototype, 'tail', {
  get<A>(this: List<A>): List<A> {
    return tail(this);
  },
});

Object.defineProperty(List.prototype, 'init', {
  get<A>(this: List<A>): List<A> {
    return init(this);
  },
});

Object.defineProperty(List.prototype, 'last', {
  get<A>(this: List<A>): A {
    return last(this);
  },
});

Object.defineProperty(List.prototype, 'lastOption', {
  get<A>(this: List<A>): Option<A> {
    return lastOption(this);
  },
});

Object.defineProperty(List.prototype, 'uncons', {
  get<A>(this: List<A>): Option<[A, List<A>]> {
    return uncons(this);
  },
});

Object.defineProperty(List.prototype, 'isEmpty', {
  get<A>(this: List<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(List.prototype, 'nonEmpty', {
  get<A>(this: List<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(List.prototype, 'size', {
  get<A>(this: List<A>): unknown {
    return size(this);
  },
});

Object.defineProperty(List.prototype, 'toArray', {
  get<A>(this: List<A>): A[] {
    return toArray(this);
  },
});

Object.defineProperty(List.prototype, 'reverse', {
  get<A>(this: List<A>): List<A> {
    return reverse(this);
  },
});

List.prototype.equals = function <A>(
  this: List<A>,
  E: Eq<A>,
  that: List<A>,
): boolean {
  return equals_(E, this, that);
};

List.prototype.notEquals = function <A>(
  this: List<A>,
  E: Eq<A>,
  that: List<A>,
): boolean {
  return notEquals_(E, this, that);
};

List.prototype.prepend = function <A>(this: List<A>, x: A): List<A> {
  return prepend_(this, x);
};

List.prototype.concat = function <A>(this: List<A>, that: List<A>): List<A> {
  return concat_<A>(this, that);
};

List.prototype['+++'] = function <A>(this: List<A>, that: List<A>): List<A> {
  return this.concat(that);
};

List.prototype.elem = function <A>(this: List<A>, idx: number): A {
  return elem_(this, idx);
};

List.prototype.all = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): boolean {
  return all_(this, p);
};

List.prototype.any = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): boolean {
  return any_(this, p);
};

List.prototype.count = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): number {
  return count_(this, p);
};

List.prototype.take = function <A>(this: List<A>, n: number): List<A> {
  return take_(this, n);
};

List.prototype.takeRight = function <A>(this: List<A>, n: number): List<A> {
  return takeRight_(this, n);
};

List.prototype.drop = function <A>(this: List<A>, n: number): List<A> {
  return drop_(this, n);
};

List.prototype.dropRight = function <A>(this: List<A>, n: number): List<A> {
  return dropRight_(this, n);
};

List.prototype.slice = function <A>(
  this: List<A>,
  from: number,
  until: number,
): List<A> {
  return slice_(this, from, until);
};

List.prototype.splitAt = function <A>(
  this: List<A>,
  idx: number,
): [List<A>, List<A>] {
  return splitAt_(this, idx);
};

List.prototype.filter = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): List<A> {
  return filter_(this, p);
};

List.prototype.map = function <A, B>(this: List<A>, f: (a: A) => B): List<B> {
  return map_(this, f);
};

List.prototype.flatMap = function <A, B>(
  this: List<A>,
  f: (a: A) => List<B>,
): List<B> {
  return flatMap_(this, f);
};

Object.defineProperty(List.prototype, 'flatten', {
  get<A>(this: List<List<A>>): List<A> {
    return flatten(this);
  },
});

List.prototype.fold = function <A, B>(
  this: List<A>,
  onNil: () => B,
  onCons: (h: A, t: List<A>) => B,
): B {
  return fold_(this, onNil, onCons);
};

List.prototype.foldLeft = function <A, B>(
  this: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): B {
  return foldLeft_(this, z, f);
};

List.prototype.foldLeft1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): A {
  return foldLeft1_(this, f);
};

List.prototype.foldRight = function <A, B>(
  this: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): B {
  return foldRight_(this, z, f);
};

List.prototype.foldRight1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): A {
  return foldRight1_(this, f);
};

List.prototype.foldMap = function <A, M>(
  this: List<A>,
  M: Monoid<M>,
): (f: (a: A) => M) => M {
  return f => foldMap_(M)(this, f);
};

List.prototype.foldMapK = function <F extends URIS, A>(
  this: List<A>,
  F: MonoidK<F>,
): <C, S, R, E, B>(
  f: (a: A) => Kind<F, C, S, R, E, B>,
) => Kind<F, C, S, R, E, B> {
  return f => foldMapK_(F)(this, f);
};

List.prototype.zip = function <A, B>(
  this: List<A>,
  that: List<B>,
): List<[A, B]> {
  return zip_(this, that);
};

List.prototype.zipWith = function <A, B, C>(
  this: List<A>,
  that: List<B>,
  f: (a: A, b: B) => C,
): List<C> {
  return zipWith_(this, that, f);
};

Object.defineProperty(List.prototype, 'zipWithIndex', {
  get<A>(this: List<A>): List<[A, number]> {
    return zipWithIndex(this);
  },
});

List.prototype.zipPad = function <A, B>(
  this: List<A>,
  that: List<B>,
  defaultL: () => A,
  defaultR: () => B,
): List<[A, B]> {
  return zipPad_(this, that, defaultL, defaultR);
};

List.prototype.zipWithPad = function <A, B, C>(
  this: List<A>,
  that: List<B>,
  defaultL: () => A,
  defaultR: () => B,
  f: (a: A, b: B) => C,
): List<C> {
  return zipWithPad_(this, that, defaultL, defaultR, f);
};

List.prototype.collect = function <A, B>(
  this: List<A>,
  f: (a: A) => Option<B>,
): List<B> {
  return collect_(this, f);
};

List.prototype.collectWhile = function <A, B>(
  this: List<A>,
  f: (a: A) => Option<B>,
): List<B> {
  return collectWhile_(this, f);
};

List.prototype.partition = function <A, L, R>(
  this: List<A>,
  f: (a: A) => Either<L, R>,
): [List<L>, List<R>] {
  return partition_(this, f);
};

List.prototype.scanLeft = function <A, B>(
  this: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): List<B> {
  return scanLeft_(this, z, f);
};

List.prototype.scanLeft1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): List<A> {
  return scanLeft1_(this, f);
};

List.prototype.scanRight = function <A, B>(
  this: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): List<B> {
  return scanRight_(this, z, f);
};

List.prototype.scanRight1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): List<A> {
  return scanRight1_(this, f);
};

List.prototype.traverse = function <G extends URIS, A>(
  this: List<A>,
  G: Applicative<G>,
): <C, S, R, E, B>(
  f: (a: A) => Kind<G, C, S, R, E, B>,
) => Kind<G, C, S, R, E, List<B>> {
  return f => traverse_(G)(this, f);
};

List.prototype.sequence = function <G extends URIS, C, S, R, E, A>(
  this: List<Kind<G, C, S, R, E, A>>,
  G: Applicative<G>,
): Kind<G, C, S, R, E, List<A>> {
  return sequence(G)(this);
};

List.prototype.flatTraverse = function <G extends URIS, C, S, R, E, A>(
  G: Applicative<G>,
): <B>(
  f: (a: A) => Kind<G, C, S, R, E, List<B>>,
) => Kind<G, C, S, R, E, List<B>> {
  return f => flatTraverse_(G, this, f);
};

List.prototype.flatSequence = function <G extends URIS, C, S, R, E, A>(
  this: List<Kind<G, C, S, R, E, List<A>>>,
  G: Applicative<G>,
): Kind<G, C, S, R, E, List<A>> {
  return flatSequence(G)(this);
};

List.prototype.show = function <A>(
  this: List<A>,
  S: Show<A> = Show.fromToString(),
): string {
  return show_(S, this);
};
