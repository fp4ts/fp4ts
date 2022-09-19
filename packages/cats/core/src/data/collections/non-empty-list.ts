// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $type,
  HKT,
  id,
  Kind,
  Lazy,
  lazyVal,
  throwError,
  tupled,
  TyK,
  TyVar,
} from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';

import { Functor } from '../../functor';
import { SemigroupK } from '../../semigroup-k';
import { CoflatMap } from '../../coflat-map';
import { MonoidK } from '../../monoid-k';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Applicative } from '../../applicative';
import { Eval } from '../../eval';
import { Traversable } from '../../traversable';
import { Align } from '../../align';

import { Option, Some, None } from '../option';
import { Either } from '../either';
import { Ior } from '../ior';

import { List, ListBuffer } from './list';
import { Vector } from './vector';
import { EqK } from '../../eq-k';

export type NonEmptyList<A> = _NonEmptyList<A>;

export const NonEmptyList: NonEmptyListObj = function <A>(
  head: A,
  tail: List<A>,
): NonEmptyList<A> {
  return new _NonEmptyList(head, tail);
} as any;

NonEmptyList.pure = <A>(a: A): NonEmptyList<A> =>
  new _NonEmptyList(a, List.empty);

NonEmptyList.of = <A>(x: A, ...xs: A[]): NonEmptyList<A> =>
  new _NonEmptyList(x, List.fromArray(xs));

NonEmptyList.fromList = <A>(xs: List<A>): Option<NonEmptyList<A>> =>
  xs.popHead.map(([h, t]) => new _NonEmptyList(h, t));

NonEmptyList.unsafeFromList = <A>(xs: List<A>): NonEmptyList<A> =>
  NonEmptyList.fromList(xs).get;

NonEmptyList.fromVector = <A>(xs: Vector<A>): Option<NonEmptyList<A>> =>
  NonEmptyList.fromIterator(xs.iterator);

NonEmptyList.fromArray = <A>(xs: A[]): Option<NonEmptyList<A>> =>
  NonEmptyList.fromIterator(xs[Symbol.iterator]());

NonEmptyList.fromIterator = <A>(it: Iterator<A>): Option<NonEmptyList<A>> => {
  const next = it.next();
  return next.done
    ? None
    : Some(new _NonEmptyList(next.value, List.fromIterator(it)));
};

class _NonEmptyList<out A> {
  public constructor(public readonly head: A, public readonly tail: List<A>) {}

  public get init(): List<A> {
    return this.tail.isEmpty
      ? List.pure(this.head)
      : this.tail.init.cons(this.head);
  }

  public get last(): A {
    return this.tail.lastOption.getOrElse(() => this.head);
  }

  public get uncons(): [A, List<A>] {
    return [this.head, this.tail];
  }

  public get popLast(): [A, List<A>] {
    return this.tail.popLast.fold(
      () => [this.head, List.empty],
      ([l, ini]) => [l, ini.cons(this.head)],
    );
  }

  public get size(): number {
    return this.tail.size + 1;
  }

  public get iterator(): Iterator<A> {
    return this.toList.iterator;
  }
  public [Symbol.iterator](): Iterator<A> {
    return this.iterator;
  }

  public get reverseIterator(): Iterator<A> {
    return this.toList.reverseIterator;
  }

  public get reverse(): NonEmptyList<A> {
    let h = this.head;
    let rest = this.tail;
    let acc: List<A> = List.empty;

    while (rest.nonEmpty) {
      acc = acc.cons(h);
      h = rest.head;
      rest = rest.tail;
    }

    return new _NonEmptyList(h, acc);
  }

  public get toArray(): A[] {
    return this.tail.cons(this.head).toArray;
  }
  public get toList(): List<A> {
    return this.tail.cons(this.head);
  }
  public get toVector(): Vector<A> {
    return Vector.fromList(this.tail.cons(this.head));
  }

  public prepend<B>(this: NonEmptyList<B>, that: B): NonEmptyList<B> {
    return new _NonEmptyList(that, this.tail.cons(this.head));
  }
  public cons<B>(this: NonEmptyList<B>, that: B): NonEmptyList<B> {
    return this.prepend(that);
  }
  public '+::'<B>(this: NonEmptyList<B>, that: B): NonEmptyList<B> {
    return this.prepend(that);
  }

  public append<B>(this: NonEmptyList<B>, that: B): NonEmptyList<B> {
    return new _NonEmptyList(this.head, this.tail.snoc(that));
  }
  public snoc<B>(this: NonEmptyList<B>, that: B): NonEmptyList<B> {
    return this.append(that);
  }
  public '::+'<B>(this: NonEmptyList<B>, that: B): NonEmptyList<B> {
    return this.append(that);
  }

  public concat<B>(this: NonEmptyList<B>, that: List<B>): NonEmptyList<B> {
    return new _NonEmptyList(this.head, this.tail.concat(that));
  }
  public '+++'<B>(this: NonEmptyList<B>, that: List<B>): NonEmptyList<B> {
    return this.concat(that);
  }
  public concatNel<B>(
    this: NonEmptyList<B>,
    that: NonEmptyList<B>,
  ): NonEmptyList<B> {
    return new _NonEmptyList(this.head, this.tail.concat(that.toList));
  }

  public elem(idx: number): A {
    return this.elemOption(idx).getOrElse(() =>
      throwError(new Error('Index out of bounds')),
    );
  }
  public '!!'(idx: number): A {
    return this.elem(idx);
  }

  public elemOption(idx: number): Option<A> {
    return idx === 0 ? Some(this.head) : this.tail.elemOption(idx - 1);
  }
  public '!?'(idx: number): Option<A> {
    return this.elemOption(idx);
  }

  public all(p: (a: A) => boolean): boolean {
    return p(this.head) && this.tail.all(p);
  }
  public any(p: (a: A) => boolean): boolean {
    return p(this.head) || this.tail.any(p);
  }
  public count(p: (a: A) => boolean): number {
    return (p(this.head) ? 1 : 0) + this.tail.count(p);
  }

  public take(n: number): List<A> {
    return this.toList.take(n);
  }
  public takeWhile<B extends A>(p: (a: A) => a is B): List<B>;
  public takeWhile(p: (a: A) => boolean): List<A>;
  public takeWhile(p: (a: A) => boolean): List<A> {
    return this.toList.takeWhile(p);
  }
  public takeRight(n: number): List<A> {
    return this.toList.takeRight(n);
  }
  public drop(n: number): List<A> {
    return this.toList.drop(n);
  }
  public dropWhile(p: (a: A) => boolean): List<A> {
    return this.toList.dropWhile(p);
  }
  public dropRight(n: number): List<A> {
    return this.toList.dropRight(n);
  }

  public slice(from: number, to: number): List<A> {
    return this.toList.slice(from, to);
  }
  public splitAt(idx: number): [List<A>, List<A>] {
    return this.toList.splitAt(idx);
  }

  public filter(p: (a: A) => boolean): List<A> {
    return this.toList.filter(p);
  }
  public collect<B>(f: (a: A) => Option<B>): List<B> {
    return this.toList.collect(f);
  }
  public collectWhile<B>(f: (a: A) => Option<B>): List<B> {
    return this.toList.collectWhile(f);
  }
  public map<B>(f: (a: A) => B): NonEmptyList<B> {
    return new _NonEmptyList(f(this.head), this.tail.map(f));
  }

  public flatMap<B>(f: (a: A) => NonEmptyList<B>): NonEmptyList<B> {
    return f(this.head)['+++'](this.tail.flatMap(x => f(x).toList));
  }
  public coflatMap<B>(f: (as: NonEmptyList<A>) => B): NonEmptyList<B> {
    const buf = new ListBuffer<B>();
    const nhd = f(this);

    let rest = this.tail;
    while (rest.nonEmpty) {
      buf.addOne(f(new _NonEmptyList(rest.head, rest.tail)));
      rest = rest.tail;
    }
    return new _NonEmptyList(nhd, buf.toList);
  }

  public flatten<B>(this: NonEmptyList<NonEmptyList<B>>): NonEmptyList<B> {
    return this.flatMap(id);
  }

  public align<B>(that: NonEmptyList<B>): NonEmptyList<Ior<A, B>> {
    return new _NonEmptyList(
      Ior.Both(this.head, that.head),
      this.tail.align(that.tail),
    );
  }

  public zip<B>(that: NonEmptyList<B>): NonEmptyList<[A, B]> {
    return this.zipWith(that, tupled);
  }
  public zipWith<B, C>(
    that: NonEmptyList<B>,
    f: (a: A, b: B) => C,
  ): NonEmptyList<C> {
    return new _NonEmptyList(
      f(this.head, that.head),
      this.tail.zipWith(that.tail, f),
    );
  }

  public get zipWithIndex(): NonEmptyList<[A, number]> {
    const buf = new ListBuffer<[A, number]>();
    let idx = 1;
    let rest = this.tail;
    while (rest.nonEmpty) {
      buf.addOne([rest.head, idx++]);
      rest = rest.tail;
    }
    return new _NonEmptyList([this.head, 0], buf.toList);
  }

  public zipAll<AA, B>(
    this: NonEmptyList<AA>,
    that: NonEmptyList<B>,
    defaultL: () => AA,
    defaultR: () => B,
  ): NonEmptyList<[AA, B]> {
    return new _NonEmptyList(
      [this.head, that.head],
      this.tail.zipAll(that.tail, defaultL, defaultR),
    );
  }
  public zipAllWith<AA, B, C>(
    this: NonEmptyList<AA>,
    that: NonEmptyList<B>,
    defaultL: () => AA,
    defaultR: () => B,
    f: (a: AA, b: B) => C,
  ): NonEmptyList<C> {
    return new _NonEmptyList(
      f(this.head, that.head),
      this.tail.zipAllWith(that.tail, defaultL, defaultR, f),
    );
  }

  public forEach(f: (a: A) => void): void {
    f(this.head);
    this.tail.forEach(f);
  }

  public partition<L, R>(f: (a: A) => Either<L, R>): [List<L>, List<R>] {
    return this.toList.partition(f);
  }

  public foldLeft<B>(z: B, f: (b: B, a: A) => B): B {
    return this.tail.foldLeft(f(z, this.head), f);
  }
  public foldLeft1<B>(this: NonEmptyList<B>, f: (x: B, y: B) => B): B {
    return this.toList.foldLeft1(f);
  }
  public foldRight<B>(ez: Eval<B>, f: (a: A, eb: Eval<B>) => Eval<B>): Eval<B> {
    return Eval.defer(() => f(this.head, this.tail.foldRight(ez, f)));
  }
  public foldRight1<B>(
    this: NonEmptyList<B>,
    f: (x: B, ey: Eval<B>) => Eval<B>,
  ): Eval<B> {
    return this.toList.foldRight1(f);
  }
  public foldRight_<B>(z: B, f: (a: A, b: B) => B): B {
    return f(this.head, this.tail.foldRight_(z, f));
  }
  public foldRight1_<B>(this: NonEmptyList<B>, f: (x: B, y: B) => B): B {
    return this.toList.foldRight1_(f);
  }

  public foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => M {
    return this.toList.foldMap(M);
  }
  public foldMapK<F>(
    F: MonoidK<F>,
  ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [B]> {
    return this.toList.foldMapK(F);
  }

  public traverse<G>(
    G: Applicative<G>,
  ): <B>(f: (a: A) => Kind<G, [B]>) => Kind<G, [NonEmptyList<B>]> {
    return f =>
      G.map2Eval_(
        f(this.head),
        Eval.always(() => this.tail.traverse(G)(f)),
      )((hd, tl) => new _NonEmptyList(hd, tl)).value;
  }

  public equals<B>(
    this: NonEmptyList<B>,
    E: Eq<B>,
    that: NonEmptyList<B>,
  ): boolean {
    return E.equals(this.head, that.head) && this.tail.equals(E, that.tail);
  }
  public notEquals<B>(
    this: NonEmptyList<B>,
    E: Eq<B>,
    that: NonEmptyList<B>,
  ): boolean {
    return !this.equals(E, that);
  }
}

interface NonEmptyListObj {
  <A>(h: A, tl: List<A>): NonEmptyList<A>;
  pure<A>(a: A): NonEmptyList<A>;
  of<A>(h: A, ...tl: A[]): NonEmptyList<A>;
  fromList<A>(xs: List<A>): Option<NonEmptyList<A>>;
  unsafeFromList<A>(xs: List<A>): NonEmptyList<A>;
  fromVector<A>(xs: Vector<A>): Option<NonEmptyList<A>>;
  fromArray<A>(xs: A[]): Option<NonEmptyList<A>>;
  fromIterator<A>(it: Iterator<A>): Option<NonEmptyList<A>>;

  // -- Instances

  EqK: EqK<NonEmptyListF>;
  SemigroupK: SemigroupK<NonEmptyListF>;
  Functor: Functor<NonEmptyListF>;
  Align: Align<NonEmptyListF>;
  CoflatMap: CoflatMap<NonEmptyListF>;
  Monad: Monad<NonEmptyListF>;
  Foldable: Foldable<NonEmptyListF>;
  Traversable: Traversable<NonEmptyListF>;
}

Object.defineProperty(NonEmptyList, 'EqK', {
  get() {
    return nelEqK();
  },
});
Object.defineProperty(NonEmptyList, 'SemigroupK', {
  get() {
    return nelSemigroupK();
  },
});
Object.defineProperty(NonEmptyList, 'Functor', {
  get() {
    return nelFunctor();
  },
});
Object.defineProperty(NonEmptyList, 'Align', {
  get() {
    return nelAlign();
  },
});
Object.defineProperty(NonEmptyList, 'CoflatMap', {
  get() {
    return nelCoflatMap();
  },
});
Object.defineProperty(NonEmptyList, 'Monad', {
  get() {
    return nelMonad();
  },
});
Object.defineProperty(NonEmptyList, 'Foldable', {
  get() {
    return nelFoldable();
  },
});
Object.defineProperty(NonEmptyList, 'Traversable', {
  get() {
    return nelTraversable();
  },
});

// -- Instances

const nelEqK: Lazy<EqK<NonEmptyListF>> = lazyVal(() =>
  EqK.of({
    liftEq: <A>(E: Eq<A>) =>
      Eq.of<NonEmptyList<A>>({ equals: (x, y) => x.equals(E, y) }),
  }),
);

const nelSemigroupK: Lazy<SemigroupK<NonEmptyListF>> = lazyVal(() =>
  SemigroupK.of({ combineK_: (x, y) => x.concatNel(y()) }),
);

const nelFunctor: Lazy<Functor<NonEmptyListF>> = lazyVal(() =>
  Functor.of({ map_: (xs, f) => xs.map(f) }),
);

const nelAlign: Lazy<Align<NonEmptyListF>> = lazyVal(() =>
  Align.of({
    functor: nelFunctor(),
    align_: (fa, fb) => fa.align(fb),
  }),
);

const nelCoflatMap: Lazy<CoflatMap<NonEmptyListF>> = lazyVal(() =>
  CoflatMap.of({ ...nelFunctor(), coflatMap_: (xs, f) => xs.coflatMap(f) }),
);

const nelMonad: Lazy<Monad<NonEmptyListF>> = lazyVal(() =>
  Monad.of({
    ...nelFunctor(),
    pure: NonEmptyList.pure,
    flatMap_: (xs, f) => xs.flatMap(f),
    tailRecM_: <A, B>(
      a: A,
      f: (a: A) => NonEmptyList<Either<A, B>>,
    ): NonEmptyList<B> => {
      const buf = new ListBuffer<B>();

      let v = f(a);
      while (true) {
        if (v.head.isRight) {
          buf.addOne(v.head.get);
          const tlo = NonEmptyList.fromList(v.tail);
          if (tlo.isEmpty) break;

          v = tlo.get;
        } else {
          v = f(v.head.getLeft)['+++'](v.tail);
        }
      }

      return NonEmptyList.unsafeFromList(buf.toList);
    },
  }),
);

const nelFoldable: Lazy<Foldable<NonEmptyListF>> = lazyVal(() =>
  Foldable.of({
    foldLeft_: (fa, b, f) => fa.foldLeft(b, f),
    foldRight_: (fa, eb, f) => List.Foldable.foldRight_(fa.toList, eb, f),

    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(fa: NonEmptyList<A>, f: (a: A) => M) =>
        fa.foldMap(M)(f),

    all_: (fa, f) => fa.all(f),
    any_: (fa, f) => fa.any(f),
    count_: (fa, f) => fa.count(f),

    elem_: (fa, idx) => fa.elemOption(idx),
  }),
);

const nelTraversable: Lazy<Traversable<NonEmptyListF>> = lazyVal(() =>
  Traversable.of({
    ...nelFunctor(),
    ...nelFoldable(),

    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: NonEmptyList<A>, f: (a: A) => Kind<G, [B]>) =>
        fa.traverse(G)(f),
  }),
);

// -- HKT

interface _NonEmptyList<A> extends HKT<NonEmptyListF, [A]> {}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface NonEmptyListF extends TyK<[unknown]> {
  [$type]: NonEmptyList<TyVar<this, 0>>;
}
