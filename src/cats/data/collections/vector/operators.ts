import { AnyK, id, Kind, pipe } from '../../../../core';
import { Applicative } from '../../../applicative';
import { Monoid } from '../../../monoid';
import { MonoidK } from '../../../monoid-k';
import { Show } from '../../../show';
import { Option } from '../../option';
import { List } from '../list';

import * as FT from '../finger-tree/functional';
import { Vector } from './algebra';
import { empty } from './constructors';
import { sizeMeasured } from './instances';

const throwError = (e: Error) => {
  throw e;
};

const FT_ = {
  popHead: FT.popHead(sizeMeasured),
  popLast: FT.popLast(sizeMeasured),
  prepend_: FT.prepend_(sizeMeasured),
  append_: FT.append_(sizeMeasured),
  concat_: FT.concat_(sizeMeasured),
  splitAt_: FT.splitAt_(sizeMeasured),
};

export const isEmpty: <A>(xs: Vector<A>) => boolean = xs =>
  FT.isEmpty(xs._root);
export const nonEmpty: <A>(xs: Vector<A>) => boolean = xs =>
  FT.nonEmpty(xs._root);

export const head: <A>(xs: Vector<A>) => A = xs =>
  headOption(xs).getOrElse(() => throwError(new Error('Vector.empty.head')));

export const headOption: <A>(xs: Vector<A>) => Option<A> = xs =>
  popHead(xs).map(([h]) => h);

export const tail: <A>(xs: Vector<A>) => Vector<A> = xs =>
  popHead(xs)
    .map(([, tl]) => tl)
    .getOrElse(() => empty);

export const last: <A>(xs: Vector<A>) => A = xs =>
  lastOption(xs).getOrElse(() => throwError(new Error('Vector.empty.last')));

export const lastOption: <A>(xs: Vector<A>) => Option<A> = xs =>
  popLast(xs).map(([h]) => h);

export const init: <A>(xs: Vector<A>) => Vector<A> = xs =>
  popLast(xs)
    .map(([, tl]) => tl)
    .getOrElse(() => empty);

export const toList = <A>(v: Vector<A>): List<A> =>
  foldRight_(v, List.empty as List<A>, (x, xs) => xs.prepend(x));

export const toArray = <A>(v: Vector<A>): A[] =>
  foldLeft_(v, [] as A[], (xs, x) => [...xs, x]);

export const popHead = <A>(v: Vector<A>): Option<[A, Vector<A>]> =>
  FT_.popHead(v._root).map(([hd, tl]) => [hd, new Vector(tl)]);

export const popLast = <A>(v: Vector<A>): Option<[A, Vector<A>]> =>
  FT_.popLast(v._root).map(([hd, tl]) => [hd, new Vector(tl)]);

export const prepend: <B>(x: B) => <A extends B>(xs: Vector<A>) => Vector<B> =
  x => xs =>
    prepend_(xs, x);

export const cons: <B>(x: B) => <A extends B>(xs: Vector<A>) => Vector<B> =
  x => xs =>
    cons_(xs, x);

export const append: <B>(x: B) => <A extends B>(xs: Vector<A>) => Vector<B> =
  x => xs =>
    append_(xs, x);

export const snoc: <B>(x: B) => <A extends B>(xs: Vector<A>) => Vector<B> =
  x => xs =>
    snoc_(xs, x);

export const concat: <B>(
  ys: Vector<B>,
) => <A extends B>(xs: Vector<A>) => Vector<B> = ys => xs => concat_(xs, ys);

export const elem: (idx: number) => <A>(xs: Vector<A>) => A = idx => xs =>
  elem_(xs, idx);

export const elemOption: (idx: number) => <A>(xs: Vector<A>) => Option<A> =
  idx => xs =>
    elemOption_(xs, idx);

export const take: (n: number) => <A>(xs: Vector<A>) => Vector<A> = n => xs =>
  take_(xs, n);

export const takeRight: (n: number) => <A>(xs: Vector<A>) => Vector<A> =
  n => xs =>
    takeRight_(xs, n);

export const drop: (n: number) => <A>(xs: Vector<A>) => Vector<A> = n => xs =>
  drop_(xs, n);

export const dropRight: (n: number) => <A>(xs: Vector<A>) => Vector<A> =
  n => xs =>
    dropRight_(xs, n);

export const slice: (
  from: number,
  until: number,
) => <A>(xs: Vector<A>) => Vector<A> = (from, until) => xs =>
  slice_(xs, from, until);

export const flatten: <A>(ffa: Vector<Vector<A>>) => Vector<A> = ffa =>
  flatMap_(ffa, id);

export const foldLeft: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (xs: Vector<A>) => B = (z, f) => xs => foldLeft_(xs, z, f);

export const foldRight: <A, B>(
  z: B,
  f: (a: A, b: B) => B,
) => (xs: Vector<A>) => B = (z, f) => xs => foldRight_(xs, z, f);

// -- Point-ful operators

export const prepend_ = <A>(v: Vector<A>, x: A): Vector<A> =>
  new Vector(FT_.prepend_(v._root, x));

export const cons_: <A>(v: Vector<A>, x: A) => Vector<A> = prepend_;

export const append_ = <A>(v: Vector<A>, x: A): Vector<A> =>
  new Vector(FT_.append_(v._root, x));

export const snoc_: <A>(v: Vector<A>, x: A) => Vector<A> = append_;

export const concat_ = <A>(xs: Vector<A>, ys: Vector<A>): Vector<A> =>
  new Vector(FT_.concat_(xs._root, ys._root));

export const elem_ = <A>(xs: Vector<A>, idx: number): A =>
  elemOption_(xs, idx).fold(
    () => throwError(new Error('Vector IndexOutOfBounds')),
    id,
  );

export const elemOption_ = <A>(xs: Vector<A>, idx: number): Option<A> =>
  FT_.splitAt_(xs._root, 0, i => i > idx).map(([, x]) => x);

export const take_ = <A>(xs: Vector<A>, n: number): Vector<A> => {
  let result: Vector<A> = empty;
  while (nonEmpty(xs) && n-- > 0) {
    const [hd, tl] = popHead(xs).get;
    result = append_(result, hd);
    xs = tl;
  }
  return result;
};

export const takeRight_ = <A>(xs: Vector<A>, n: number): Vector<A> => {
  let result: Vector<A> = empty;
  while (nonEmpty(xs) && n-- > 0) {
    const [hd, tl] = popLast(xs).get;
    result = prepend_(result, hd);
    xs = tl;
  }
  return result;
};

export const drop_ = <A>(xs: Vector<A>, n: number): Vector<A> => {
  while (nonEmpty(xs) && n-- > 0) {
    [, xs] = popHead(xs).get;
  }
  return xs;
};

export const dropRight_ = <A>(xs: Vector<A>, n: number): Vector<A> => {
  while (nonEmpty(xs) && n-- > 0) {
    [, xs] = popLast(xs).get;
  }
  return xs;
};

export const slice_ = <A>(
  xs: Vector<A>,
  from: number,
  until: number,
): Vector<A> => pipe(xs, drop(from), take(until - from));

export const splitAt_ = <A>(
  xs: Vector<A>,
  idx: number,
): [Vector<A>, Vector<A>] => {
  if (isEmpty(xs) || idx < 0) return [empty, xs];

  return FT_.splitAt_(xs._root, 0, i => i > idx).fold(
    // Idx beyond the bounds
    () => [xs, empty],
    ([before, x, after]) => [
      new Vector(before),
      prepend_(new Vector(after), x),
    ],
  );
};

export const filter_ = <A>(xs: Vector<A>, p: (a: A) => boolean): Vector<A> =>
  foldLeft_(xs, empty as Vector<A>, (ys, x) => (p(x) ? append_(ys, x) : ys));

export const collect_ = <A, B>(
  xs: Vector<A>,
  f: (a: A) => Option<B>,
): Vector<B> =>
  foldLeft_(xs, empty as Vector<B>, (ys, x) =>
    f(x).fold(
      () => ys,
      y => append_(ys, y),
    ),
  );

export const map_ = <A, B>(xs: Vector<A>, f: (a: A) => B): Vector<B> =>
  foldLeft_(xs, empty as Vector<B>, (ys, x) => append_(ys, f(x)));

export const flatMap_ = <A, B>(
  xs: Vector<A>,
  f: (a: A) => Vector<B>,
): Vector<B> => foldLeft_(xs, empty as Vector<B>, (zs, x) => concat_(zs, f(x)));

export const foldLeft_ = <A, B>(xs: Vector<A>, z: B, f: (b: B, a: A) => B): B =>
  FT.foldLeft_(xs._root, z, f);

export const foldLeft1_ = <A>(xs: Vector<A>, f: (z: A, x: A) => A): A =>
  popHead(xs).fold(
    () => throwError(new Error('Vector.empty.foldLeft1')),
    ([head, tail]) => foldLeft_(tail, head, f),
  );

export const foldRight_ = <A, B>(
  xs: Vector<A>,
  z: B,
  f: (a: A, b: B) => B,
): B => FT.foldRight_(xs._root, z, f);

export const foldRight1_ = <A>(xs: Vector<A>, f: (x: A, z: A) => A): A =>
  popLast(xs).fold(
    () => throwError(new Error('Vector.empty.foldRight')),
    ([head, tail]) => foldRight_(tail, head, f),
  );

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <A>(xs: Vector<A>, f: (a: A) => M): M =>
    foldLeft_(xs, M.empty, (r, x) => M.combine_(r, f(x)));

export const foldMapK_ =
  <F extends AnyK>(F: MonoidK<F>) =>
  <A, B>(xs: Vector<A>, f: (a: A) => Kind<F, [B]>): Kind<F, [B]> =>
    foldMap_(F.algebra())(xs, f);

export const zip_ = <A, B>(xs: Vector<A>, ys: Vector<B>): Vector<[A, B]> =>
  zipWith_(xs, ys, (x, y) => [x, y]);

export const zipWith_ = <A, B, C>(
  xs: Vector<A>,
  ys: Vector<B>,
  f: (a: A, b: B) => C,
): Vector<C> => {
  let result: Vector<C> = empty;
  while (nonEmpty(xs) && nonEmpty(ys)) {
    const [xhd, xtl] = xs.popHead.get;
    const [yhd, ytl] = ys.popHead.get;
    result = append_(result, f(xhd, yhd));
    xs = xtl;
    ys = ytl;
  }
  return result;
};

export const traverse_ =
  <G extends AnyK>(G: Applicative<G>) =>
  <A, B>(xs: Vector<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [Vector<B>]> => {
    const consF = (x: A, ys: Kind<G, [Vector<B>]>): Kind<G, [Vector<B>]> =>
      G.map2_(ys, f(x))(prepend_);
    return foldRight_(xs, G.pure(empty as Vector<A>), consF);
  };

export const show_ = <A>(S: Show<A>, xs: Vector<A>): string => {
  const values = toArray(xs).map(S.show).join(', ');
  return `[${values}]`;
};
