// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Eval,
  Kind,
  compose,
  id,
  pipe,
  throwError,
  tupled,
  flip,
} from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from '../../../applicative';
import { MonoidK } from '../../../monoid-k';
import { Ior } from '../../ior';
import { Option, Some, None } from '../../option';
import { Either } from '../../either';
import { List, ListBuffer } from '../list';
import { Vector } from '../vector';
import { Chain } from '../chain';
import { Iter } from '../iterator';
import { Array as CArray } from '../array';

import { Queue } from './algebra';
import { empty, fromIterator, fromList } from './constructors';

export const isEmpty = <A>({ _in, _out }: Queue<A>): boolean =>
  _in.isEmpty && _out.isEmpty;

export const nonEmpty = <A>(q: Queue<A>): boolean => !isEmpty(q);

export const size = <A>({ _in, _out }: Queue<A>): number =>
  _in.size + _out.size;

export const head = <A>(q: Queue<A>): A =>
  headOption(q).getOrElse(() => throwError(new Error('head on empty queue')));

export const headOption = <A>({ _in, _out }: Queue<A>): Option<A> =>
  _out.headOption.orElse(() => _in.lastOption);

export const tail = <A>({ _in, _out }: Queue<A>): Queue<A> =>
  // prettier-ignore
  _out.nonEmpty
      ? new Queue(_in, _out.tail)
  : _in.nonEmpty
    ? new Queue(List.empty, _in.reverse.tail)
    : empty;

export const dequeue = <A>({ _in, _out }: Queue<A>): Option<[A, Queue<A>]> =>
  _out.uncons
    .map(([h, t]) => tupled(h, new Queue(_in, t)))
    .orElse(() =>
      _in.reverse.uncons.map(([h, t]) => tupled(h, new Queue(List.empty, t))),
    );

export const uncons = dequeue;
export const popHead = dequeue;

export const last = <A>(q: Queue<A>): A =>
  lastOption(q).getOrElse(() => throwError(new Error('last on empty queue')));

export const lastOption = <A>({ _in, _out }: Queue<A>): Option<A> =>
  _in.headOption.orElse(() => _out.lastOption);

export const init = <A>({ _in, _out }: Queue<A>): Queue<A> =>
  // prettier-ignore
  _in.nonEmpty
      ? new Queue(_in.tail, _out)
  : _out.nonEmpty
    ? new Queue(List.empty, _out.init)
    : empty;

export const popLast = <A>({ _in, _out }: Queue<A>): Option<[A, Queue<A>]> =>
  _in.uncons
    .map(([h, tl]) => tupled(h, new Queue(tl, _out)))
    .orElse(() =>
      _out.popLast.map(([l, ini]) => tupled(l, new Queue(List.empty, ini))),
    );

export const reverse = <A>({ _in, _out }: Queue<A>): Queue<A> =>
  new Queue(_out, _in);

export const iterator = <A>({ _in, _out }: Queue<A>): Iterator<A> =>
  Iter.concat_(_out.iterator, _in.reverseIterator);

export const reverseIterator = <A>(q: Queue<A>): Iterator<A> =>
  iterator(reverse(q));

export const toArray = <A>(q: Queue<A>): A[] => Iter.toArray(iterator(q));

export const enqueue: <A>(x: A) => (q: Queue<A>) => Queue<A> = x => q =>
  enqueue_(q, x);

export const prepend = enqueue;

export const cons = <A>(q: Queue<A>, x: A): Queue<A> =>
  new Queue(q._in, q._out.prepend(x));

export const append = enqueue;

export const snoc = <A>(q: Queue<A>, x: A): Queue<A> =>
  new Queue(q._in.prepend(x), q._out);

export const concat: <A>(rhs: Queue<A>) => (lhs: Queue<A>) => Queue<A> =
  rhs => lhs =>
    concat_(lhs, rhs);

export const elem: (idx: number) => <A>(q: Queue<A>) => A = idx => q =>
  elem_(q, idx);

export const elemOption: (idx: number) => <A>(q: Queue<A>) => Option<A> =
  idx => q =>
    elemOption_(q, idx);

export const all: <A>(p: (a: A) => boolean) => (q: Queue<A>) => boolean =
  p => q =>
    all_(q, p);

export const any: <A>(p: (a: A) => boolean) => (q: Queue<A>) => boolean =
  p => q =>
    any_(q, p);

export const count: <A>(p: (a: A) => boolean) => (q: Queue<A>) => number =
  p => q =>
    count_(q, p);

export const take: (n: number) => <A>(q: Queue<A>) => Queue<A> = n => q =>
  take_(q, n);

export const takeRight: (n: number) => <A>(q: Queue<A>) => Queue<A> = n => q =>
  takeRight_(q, n);

export const drop: (n: number) => <A>(q: Queue<A>) => Queue<A> = n => q =>
  drop_(q, n);

export const dropRight: (n: number) => <A>(q: Queue<A>) => Queue<A> = n => q =>
  dropRight_(q, n);

export const slice: (
  from: number,
  until: number,
) => <A>(q: Queue<A>) => Queue<A> = (from, until) => q =>
  slice_(q, from, until);

export const splitAt: (
  idx: number,
) => <A>(q: Queue<A>) => [Queue<A>, Queue<A>] = idx => q => splitAt_(q, idx);

export const filter: <A>(p: (a: A) => boolean) => (q: Queue<A>) => Queue<A> =
  p => q =>
    filter_(q, p);

export const collect: <A, B>(
  p: (a: A) => Option<B>,
) => (q: Queue<A>) => Queue<B> = p => q => collect_(q, p);

export const collectWhile: <A, B>(
  p: (a: A) => Option<B>,
) => (q: Queue<A>) => Queue<B> = p => q => collectWhile_(q, p);

export const map: <A, B>(f: (a: A) => B) => (q: Queue<A>) => Queue<B> =
  f => q =>
    map_(q, f);

export const flatMap: <A, B>(
  f: (a: A) => Queue<B>,
) => (q: Queue<A>) => Queue<B> = f => q => flatMap_(q, f);

export const coflatMap: <A, B>(
  f: (as: Queue<A>) => B,
) => (q: Queue<A>) => Queue<B> = f => q => coflatMap_(q, f);

export const flatten = <A>(q: Queue<Queue<A>>): Queue<A> => flatMap_(q, id);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (q: Queue<A>) => B = (z, f) => q => foldLeft_(q, z, f);

export const foldLeft1: <A>(f: (b: A, a: A) => A) => (q: Queue<A>) => A =
  f => q =>
    foldLeft1_(q, f);

export const foldRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (q: Queue<A>) => B = (z, f) => q => foldRight_(q, z, f);

export const foldRight1: <A>(f: (a: A, b: A) => A) => (q: Queue<A>) => A =
  f => q =>
    foldRight1_(q, f);

export const foldMap: <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => (q: Queue<A>) => M = M => f => q =>
  foldMap_(M)(q, f);

export const foldMapK: <F>(
  F: MonoidK<F>,
) => <A, B>(f: (a: A) => Kind<F, [B]>) => (q: Queue<A>) => Kind<F, [B]> =
  F => f => q =>
    foldMapK_(F)(q, f);

export const align: <B>(
  rhs: Queue<B>,
) => <A>(lhs: Queue<A>) => Queue<Ior<A, B>> = rhs => lhs => align_(lhs, rhs);

export const zip: <B>(rhs: Queue<B>) => <A>(lhs: Queue<A>) => Queue<[A, B]> =
  rhs => lhs =>
    zip_(lhs, rhs);

export const zipWithIndex = <A>(q: Queue<A>): Queue<[A, number]> =>
  pipe(iterator(q), Iter.zipWithIndex, fromIterator);

export const zipWith: <A, B, C>(
  rhs: Queue<B>,
  f: (a: A, b: B) => C,
) => (lhs: Queue<A>) => Queue<C> = (rhs, f) => lhs => zipWith_(lhs, rhs)(f);

export const zipAll: <A, B>(
  rhs: Queue<B>,
  defaultL: () => A,
  defaultR: () => B,
) => (lhs: Queue<A>) => Queue<[A, B]> = (rhs, defaultL, defaultR) => lhs =>
  zipAll_(lhs, rhs, defaultL, defaultR);

export const zipAllWith: <A, B, C>(
  rhs: Queue<B>,
  defaultL: () => A,
  defaultR: () => B,
  f: (a: A, b: B) => C,
) => (lhs: Queue<A>) => Queue<C> = (rhs, defaultL, defaultR, f) => lhs =>
  zipAllWith_(lhs, rhs, defaultL, defaultR)(f);

export const forEach: <A>(f: (a: A) => void) => (q: Queue<A>) => void =
  f => q =>
    forEach_(q, f);

export const scanLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (q: Queue<A>) => Queue<B> = (z, f) => q => scanLeft_(q, z, f);

export const scanLeft1: <A>(
  f: (b: A, a: A) => A,
) => (q: Queue<A>) => Queue<A> = f => q => scanLeft1_(q, f);

export const scanRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (q: Queue<A>) => Queue<B> = (z, f) => q => scanRight_(q, z, f);

export const scanRight1: <A>(
  f: (a: A, b: A) => A,
) => (q: Queue<A>) => Queue<A> = f => q => scanRight1_(q, f);

export const traverse: <G>(
  G: Applicative<G>,
) => <A, B>(
  f: (a: A) => Kind<G, [B]>,
) => (q: Queue<A>) => Kind<G, [Queue<B>]> = G => f => q => traverse_(G)(q, f);

export const toList = <A>(q: Queue<A>): List<A> =>
  List.fromIterator(iterator(q));

export const toVector = <A>(q: Queue<A>): Vector<A> =>
  Vector.fromIterator(iterator(q));

// -- Point-ful operators

export const prepend_ = cons;

export const enqueue_ = <A>(q: Queue<A>, x: A): Queue<A> =>
  new Queue(q._in.prepend(x), q._out);

export const append_ = enqueue_;

export const concat_ = <A>(lhs: Queue<A>, rhs: Queue<A>): Queue<A> => {
  const newIn = rhs._in['+++'](rhs._out.reverse['+++'](lhs._in));
  return newIn === lhs._in ? lhs : new Queue(newIn, lhs._out);
};

export const elem_ = <A>(q: Queue<A>, idx: number): A =>
  elemOption_(q, idx).fold(
    () => throwError(new Error('Index out of bounds')),
    id,
  );

export const elemOption_ = <A>(q: Queue<A>, idx: number): Option<A> =>
  Option(Iter.elem_(iterator(q), idx));

export const all_ = <A>(
  { _in, _out }: Queue<A>,
  p: (a: A) => boolean,
): boolean => _out.all(p) && _in.all(p);

export const any_ = <A>(
  { _in, _out }: Queue<A>,
  p: (a: A) => boolean,
): boolean => _out.any(p) || _in.any(p);

export const count_ = <A>(
  { _in, _out }: Queue<A>,
  p: (a: A) => boolean,
): number => _out.count(p) + _in.count(p);

export const take_ = <A>({ _in, _out }: Queue<A>, n: number): Queue<A> => {
  const newOut = _out.take(n);
  return new Queue(_in.takeRight(n - newOut.size), newOut);
};

export const takeRight_ = <A>({ _in, _out }: Queue<A>, n: number): Queue<A> => {
  const newIn = _in.take(n);
  return new Queue(newIn, _out.takeRight(n - newIn.size));
};

export const drop_ = <A>({ _in, _out }: Queue<A>, n: number): Queue<A> => {
  const outSize = _out.size;
  const newOut = _out.drop(n);
  return new Queue(_in.dropRight(n - outSize), newOut);
};

export const dropRight_ = <A>({ _in, _out }: Queue<A>, n: number): Queue<A> => {
  const inSize = _in.size;
  const newIn = _in.drop(n);
  return new Queue(newIn, _out.dropRight(n - inSize));
};

export const slice_ = <A>(q: Queue<A>, from: number, until: number): Queue<A> =>
  pipe(q, drop(from), take(until - from));

export const splitAt_ = <A>(q: Queue<A>, idx: number): [Queue<A>, Queue<A>] => {
  const [l, r] = toList(q).splitAt(idx);
  return [new Queue(List.empty, l), new Queue(List.empty, r)];
};

export const filter_ = <A>(q: Queue<A>, p: (a: A) => boolean): Queue<A> =>
  pipe(iterator(q), Iter.filter(p), fromIterator);

export const collect_ = <A, B>(q: Queue<A>, p: (a: A) => Option<B>): Queue<B> =>
  pipe(iterator(q), Iter.collect(p), fromIterator);

export const collectWhile_ = <A, B>(
  q: Queue<A>,
  p: (a: A) => Option<B>,
): Queue<B> => pipe(iterator(q), Iter.collectWhile(p), fromIterator);

export const map_ = <A, B>(q: Queue<A>, f: (a: A) => B): Queue<B> =>
  pipe(iterator(q), Iter.map(f), fromIterator);

export const flatMap_ = <A, B>(q: Queue<A>, f: (a: A) => Queue<B>): Queue<B> =>
  pipe(iterator(q), Iter.flatMap(compose(iterator, f)), fromIterator);

export const coflatMap_ = <A, B>(
  q: Queue<A>,
  f: (as: Queue<A>) => B,
): Queue<B> => {
  const buf = new ListBuffer<B>();
  while (nonEmpty(q)) {
    buf.addOne(f(q));
    q = tail(q);
  }
  return new Queue(List.empty, buf.toList);
};

export const foldLeft_ = <A, B>(q: Queue<A>, z: B, f: (b: B, a: A) => B): B =>
  pipe(iterator(q), Iter.fold(z, f));

export const foldLeft1_ = <A>(q: Queue<A>, f: (b: A, a: A) => A): A =>
  popHead(q)
    .map(([h, t]) => foldLeft_(t, h, f))
    .getOrElse(() => throwError(new Error('foldLeft1 on empty queue')));

export const foldRight_ = <A, B>(q: Queue<A>, z: B, f: (a: A, b: B) => B): B =>
  pipe(reverseIterator(q), Iter.fold(z, flip(f)));

export const foldRightEval_ = <A, B>(
  q: Queue<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> => Iter.foldRight_(iterator(q), ez, f);

export const foldRight1_ = <A>(q: Queue<A>, f: (a: A, b: A) => A): A =>
  popLast(q)
    .map(([l, i]) => foldRight_(i, l, f))
    .getOrElse(() => throwError(new Error('foldLeft1 on empty queue')));

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <A>(q: Queue<A>, f: (a: A) => M): M =>
    foldRightEval_(q, Eval.now(M.empty), (a, eb) => M.combineEval_(f(a), eb))
      .value;

export const foldMapK_ =
  <F>(F: MonoidK<F>) =>
  <A, B>(q: Queue<A>, f: (a: A) => Kind<F, [B]>): Kind<F, [B]> =>
    foldRightEval_(q, Eval.now(F.emptyK<B>()), (a, eb) =>
      F.combineKEval_(f(a), eb),
    ).value;

export const align_ = <A, B>(lhs: Queue<A>, rhs: Queue<B>): Queue<Ior<A, B>> =>
  zipAllWith_(
    map_(lhs, Some),
    map_(rhs, Some),
    () => None,
    () => None,
  )((oa, ob) => Ior.fromOptions(oa, ob).get);

export const zip_ = <A, B>(lhs: Queue<A>, rhs: Queue<B>): Queue<[A, B]> =>
  zipWith_(lhs, rhs)(tupled);

export const zipWith_ =
  <A, B>(lhs: Queue<A>, rhs: Queue<B>) =>
  <C>(f: (a: A, b: B) => C): Queue<C> =>
    fromIterator(Iter.zipWith_(iterator(lhs), iterator(rhs))(f));

export const zipAll_ = <A, B>(
  lhs: Queue<A>,
  rhs: Queue<B>,
  defaultL: () => A,
  defaultR: () => B,
): Queue<[A, B]> => zipAllWith_(lhs, rhs, defaultL, defaultR)(tupled);

export const zipAllWith_ =
  <A, B>(lhs: Queue<A>, rhs: Queue<B>, defaultL: () => A, defaultR: () => B) =>
  <C>(f: (a: A, b: B) => C): Queue<C> =>
    fromIterator(
      Iter.zipAllWith_(iterator(lhs), iterator(rhs), defaultL, defaultR)(f),
    );

export const forEach_ = <A>(q: Queue<A>, f: (a: A) => void): void => {
  const iter = iterator(q);
  for (let i = iter.next(); !i.done; i = iter.next()) {
    f(i.value);
  }
};

export const partition_ = <A>(
  { _in, _out }: Queue<A>,
  f: (a: A) => boolean,
): [Queue<A>, Queue<A>] => {
  const inPartition = _in.partition(f);
  const outPartition = _out.partition(f);

  return [
    new Queue(inPartition[0], outPartition[0]),
    new Queue(inPartition[1], outPartition[1]),
  ];
};

export const partitionWith_ = <A, L, R>(
  { _in, _out }: Queue<A>,
  f: (a: A) => Either<L, R>,
): [Queue<L>, Queue<R>] => {
  const inPartition = _in.partitionWith(f);
  const outPartition = _out.partitionWith(f);

  return [
    new Queue(inPartition[0], outPartition[0]),
    new Queue(inPartition[1], outPartition[1]),
  ];
};

export const scanLeft_ = <A, B>(
  q: Queue<A>,
  z: B,
  f: (b: B, a: A) => B,
): Queue<B> => pipe(iterator(q), Iter.scan(z, f), fromIterator);

export const scanLeft1_ = <A>(q: Queue<A>, f: (b: A, a: A) => A): Queue<A> =>
  popHead(q)
    .map(([h, t]) => scanLeft_(t, h, f))
    .getOrElse(() => throwError(new Error('foldLeft1 on empty queue')));

export const scanRight_ = <A, B>(
  q: Queue<A>,
  z: B,
  f: (a: A, b: B) => B,
): Queue<B> => new Queue(List.empty, q.toList.scanRight(z, f));

export const scanRight1_ = <A>(q: Queue<A>, f: (a: A, b: A) => A): Queue<A> =>
  popLast(q)
    .map(([l, i]) => scanRight_(i, l, f))
    .getOrElse(() => throwError(new Error('foldLeft1 on empty queue')));

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <A, B>(q: Queue<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [Queue<B>]> =>
    G.map_(
      Chain.traverseViaChain(G, CArray.FoldableWithIndex())(toArray(q), x =>
        f(x),
      ),
      ys => fromList(ys.toList),
    );

export const traverseFilter_ =
  <G>(G: Applicative<G>) =>
  <A, B>(q: Queue<A>, f: (a: A) => Kind<G, [Option<B>]>): Kind<G, [Queue<B>]> =>
    G.map_(
      Chain.traverseFilterViaChain(G, CArray.FoldableWithIndex())(
        toArray(q),
        x => f(x),
      ),
      ys => fromList(ys.toList),
    );
