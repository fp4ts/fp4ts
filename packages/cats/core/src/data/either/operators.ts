// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, throwError } from '@fp4ts/core';
import { Eq } from '../../eq';

import { None, Option, Some } from '../option';
import { Either, view } from './algebra';
import { left, right } from './constructors';

export const fold: <E, A, B>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => (ea: Either<E, A>) => B = (onLeft, onRight) => ea =>
  fold_(ea, onLeft, onRight);

export const get = <E, A>(ea: Either<E, A>): A =>
  fold_(ea, () => throwError(new Error('Left.get')), id);

export const getLeft = <E, A>(ea: Either<E, A>): E =>
  fold_(ea, id, () => throwError(new Error('Right.getLeft')));

export const isLeft = <E, A>(ea: Either<E, A>): boolean =>
  fold_(
    ea,
    () => true,
    () => false,
  );

export const isRight = <E, A>(ea: Either<E, A>): boolean => !isLeft(ea);

export const isEmpty = <E, A>(ea: Either<E, A>): boolean => isLeft(ea);

export const nonEmpty = <E, A>(ea: Either<E, A>): boolean => isRight(ea);

export const map: <A, B>(
  f: (a: A) => B,
) => <E>(ea: Either<E, A>) => Either<E, B> = f => ea => map_(ea, f);

export const leftMap: <E, E2>(
  f: (e: E) => E2,
) => <A>(ea: Either<E, A>) => Either<E2, A> = f => ea => leftMap_(ea, f);

export const bimap: <E, A, E2, B>(
  f: (e: E) => E2,
  g: (a: A) => B,
) => (ea: Either<E, A>) => Either<E2, B> = (f, g) => ea => bimap_(ea, f, g);

export const tap: <A>(
  f: (a: A) => unknown,
) => <E>(ea: Either<E, A>) => Either<E, A> = f => ea => tap_(ea, f);

export const orElse: <E2, A2>(
  y: () => Either<E2, A2>,
) => <E extends E2, A extends A2>(x: Either<E, A>) => Either<E2, A2> = y => x =>
  orElse_(x, y);

export const getOrElse: <A2>(
  defaultValue: () => A2,
) => <E, A extends A2>(x: Either<E, A>) => A2 = defaultValue => x =>
  getOrElse_(x, defaultValue);

export const flatMap: <E2, A, B>(
  f: (a: A) => Either<E2, B>,
) => <E extends E2>(ea: Either<E, A>) => Either<E2, B> = f => ea =>
  flatMap_(ea, f);

export const flatTap: <E2, A>(
  f: (a: A) => Either<E2, unknown>,
) => <E extends E2>(ea: Either<E, A>) => Either<E2, A> = f => ea =>
  flatTap_(ea, f);

export const flatten = <E, A>(eea: Either<E, Either<E, A>>): Either<E, A> =>
  flatMap_(eea, id);

export const tailRecM: <A>(
  a: A,
) => <E, B>(f: (a: A) => Either<E, Either<A, B>>) => Either<E, B> = a => f =>
  tailRecM_(a, f);

export const swapped = <E, A>(ea: Either<E, A>): Either<A, E> =>
  fold_<E, A, Either<A, E>>(ea, right, left);

export const toOption = <A>(ea: Either<unknown, A>): Option<A> =>
  fold_(ea, () => None, Some);

// -- Point-ful operators

export const map_ = <E, A, B>(ea: Either<E, A>, f: (a: A) => B): Either<E, B> =>
  bimap_(ea, id, f);

export const tap_ = <E, A>(
  ea: Either<E, A>,
  f: (a: A) => unknown,
): Either<E, A> =>
  map_(ea, x => {
    f(x);
    return x;
  });

export const leftMap_ = <E, E2, A>(
  ea: Either<E, A>,
  f: (e: E) => E2,
): Either<E2, A> => bimap_(ea, f, id);

export const bimap_ = <E, A, E2, B>(
  ea: Either<E, A>,
  f: (e: E) => E2,
  g: (a: A) => B,
): Either<E2, B> =>
  fold_<E, A, Either<E2, B>>(
    ea,
    e => left(f(e)),
    a => right(g(a)),
  );

export const orElse_ = <E, A>(
  x: Either<E, A>,
  y: () => Either<E, A>,
): Either<E, A> => fold_(x, y, right);

export const getOrElse_ = <E, A>(x: Either<E, A>, defaultValue: () => A): A =>
  fold_(x, defaultValue, id);

export const flatMap_ = <E, A, B>(
  ea: Either<E, A>,
  f: (a: A) => Either<E, B>,
): Either<E, B> => fold_(ea, left, x => f(x));

export const flatTap_ = <E, A>(
  ea: Either<E, A>,
  f: (a: A) => Either<E, unknown>,
): Either<E, A> => fold_(ea, left, x => map_(f(x), () => x));

export const tailRecM_ = <E, A, B>(
  a: A,
  f: (a: A) => Either<E, Either<A, B>>,
): Either<E, B> => {
  let cur: Either<E, Either<A, B>> = f(a);
  let result: Either<E, B> | undefined;

  while (!result) {
    fold_<E, Either<A, B>, void>(
      cur,
      e => (result = left(e)),
      ab =>
        fold_<A, B, void>(
          ab,
          a => (cur = f(a)),
          b => (result = right(b)),
        ),
    );
  }

  return result;
};

export const fold_ = <E, A, B1, B2 = B1>(
  ea: Either<E, A>,
  onLeft: (e: E) => B1,
  onRight: (a: A) => B2,
): B1 | B2 => {
  return ea.fold(onLeft, onRight);
};

export const equals_ =
  <E2, A2>(EE: Eq<E2>, EA: Eq<A2>) =>
  <E extends E2, A extends A2>(
    lhs: Either<E, A>,
    rhs: Either<E, A>,
  ): boolean => {
    if (lhs === rhs) return true;
    if (lhs.isLeft && rhs.isLeft) return EE.equals(lhs.getLeft, rhs.getLeft);
    if (lhs.isRight && rhs.isRight) return EA.equals(lhs.get, rhs.get);
    return false;
  };
