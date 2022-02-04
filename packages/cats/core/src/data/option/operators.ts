// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { constant, flow, id, Kind } from '@fp4ts/core';

import { Eq } from '../../eq';
import { Applicative } from '../../applicative';
import { Either } from '../either';
import { List } from '../collections/list';

import { Option, View } from './algebra';
import { none, some } from './constructors';

export const isEmpty = <A>(o: Option<A>): boolean => o === none;

export const nonEmpty = <A>(o: Option<A>): boolean => !isEmpty(o);

export const get = <A>(o: Option<A>): A => o.get;

export const toList = <A>(o: Option<A>): List<A> =>
  fold_(o, constant(List.empty), List);

export const toLeft =
  <B>(right: () => B) =>
  <A>(o: Option<A>): Either<A, B> =>
    toLeft_(o, right);

export const toRight =
  <B>(left: () => B) =>
  <A>(o: Option<A>): Either<B, A> =>
    toRight_(o, left);

export const map: <A, B>(f: (a: A) => B) => (o: Option<A>) => Option<B> =
  f => o =>
    map_(o, f);

export const tap: <A>(f: (a: A) => unknown) => (o: Option<A>) => Option<A> =
  f => o =>
    tap_(o, f);

export const orElse: <A2>(
  y: () => Option<A2>,
) => <A extends A2>(x: Option<A>) => Option<A2> = y => x => orElse_(x, y);

export const getOrElse: <A2>(
  defaultValue: () => A2,
) => <A extends A2>(x: Option<A>) => A2 = defaultValue => x =>
  getOrElse_(x, defaultValue);

export const flatMap: <A, B>(
  f: (a: A) => Option<B>,
) => (o: Option<A>) => Option<B> = f => o => flatMap_(o, f);

export const flatTap: <A>(
  f: (a: A) => Option<unknown>,
) => (o: Option<A>) => Option<A> = f => o => flatTap_(o, f);

export const flatten: <A>(o: Option<Option<A>>) => Option<A> = o =>
  flatMap_(o, id);

export const tailRecM: <A>(
  a: A,
) => <B>(f: (a: A) => Option<Either<A, B>>) => Option<B> = a => f =>
  tailRecM_(a, f);

export const fold: <A, B>(
  onNone: () => B,
  onSome: (a: A) => B,
) => (o: Option<A>) => B = (onNone, onSome) => o => fold_(o, onNone, onSome);

// -- Point-ful operators

export const toLeft_ = <A, B>(o: Option<A>, right: () => B): Either<A, B> =>
  o.fold(() => Either.right(right()), Either.left);

export const toRight_ = <A, B>(o: Option<A>, left: () => B): Either<B, A> =>
  o.fold(() => Either.left(left()), Either.right);

export const map_ = <A, B>(o: Option<A>, f: (a: A) => B): Option<B> =>
  fold_(o, () => none, flow(f, some));

export const tap_ = <A>(o: Option<A>, f: (a: A) => unknown): Option<A> =>
  map_(o, x => {
    f(x);
    return x;
  });

export const orElse_ = <A>(x: Option<A>, y: () => Option<A>): Option<A> =>
  fold_(x, y, some);

export const getOrElse_ = <A>(x: Option<A>, defaultValue: () => A): A =>
  fold_(x, defaultValue, id);

export const flatMap_ = <A, B>(
  o: Option<A>,
  f: (a: A) => Option<B>,
): Option<B> => fold_(o, () => none, f);

export const flatTap_ = <A>(
  o: Option<A>,
  f: (a: A) => Option<unknown>,
): Option<A> => flatMap_(o, x => map_(f(x), () => x));

export const tailRecM_ = <A, B>(
  a: A,
  f: (a: A) => Option<Either<A, B>>,
): Option<B> => {
  let cur: Option<Either<A, B>> = f(a);
  let result: Option<B> | undefined;

  while (!result) {
    fold_(
      cur,
      () => (result = none),
      ab =>
        ab.fold(
          a => {
            cur = f(a);
          },
          b => {
            result = some(b);
          },
        ),
    );
  }

  return result;
};

export const traverse_ =
  <F>(F: Applicative<F>) =>
  <A, B>(o: Option<A>, f: (a: A) => Kind<F, [B]>): Kind<F, [Option<B>]> =>
    fold_(
      o,
      () => F.pure(none),
      a => F.map_(f(a), some),
    );

export const fold_ = <A, B1, B2 = B1>(
  o: Option<A>,
  onNone: () => B1,
  onSome: (a: A) => B2,
): B1 | B2 => o.fold(onNone, onSome);

export const equals_ =
  <A>(E: Eq<A>) =>
  (lhs: Option<A>, rhs: Option<A>): boolean => {
    if (lhs === rhs) return true;
    if (lhs.isEmpty && rhs.isEmpty) return true;
    if (lhs.isEmpty) return false;
    if (rhs.isEmpty) return false;
    return E.equals(lhs.get, rhs.get);
  };
