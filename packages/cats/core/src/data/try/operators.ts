// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, constant, id, throwError } from '@fp4ts/core';
import { Option, None, Some } from '../option';
import { Either, Left, Right } from '../either';

import { Try, view } from './algebra';
import { failure, of, success } from './constructors';

export const isSuccess = <A>(t: Try<A>): boolean => !isFailure(t);

export const isFailure = <A>(t: Try<A>): boolean =>
  fold_(t, constant(true), constant(false));

export const toOption = <A>(t: Try<A>): Option<A> =>
  fold_(t, constant(None), Some);

export const toEither = <A>(t: Try<A>): Either<Error, A> =>
  fold_<A, Either<Error, A>>(t, Left, Right);

export const get = <A>(t: Try<A>): A => fold_(t, throwError, id);

export const getError = <A>(t: Try<A>): Error =>
  fold_(t, id, () => throwError(new Error('Try.success')));

export const getOrElse: <B>(
  defaultValue: () => B,
) => <A extends B>(t: Try<A>) => B = defaultValue => t =>
  getOrElse_(t, defaultValue);

export const map: <A, B>(f: (a: A) => B) => (fa: Try<A>) => Try<B> = f => fa =>
  map_(fa, f);

export const collect: <A, B>(f: (a: A) => Option<B>) => (t: Try<A>) => Try<B> =
  f => t =>
    collect_(t, f);

export const orElse: <B>(
  r: () => Try<B>,
) => <A extends B>(l: Try<A>) => Try<B> = r => l => orElse_(l, r);

export const flatMap: <A, B>(f: (a: A) => Try<B>) => (fa: Try<A>) => Try<B> =
  f => fa =>
    flatMap_(fa, f);

export const flatten = <A>(t: Try<Try<A>>): Try<A> => flatMap_(t, id);

export const tailRecM: <S>(
  s: S,
) => <A>(f: (s: S) => Try<Either<S, A>>) => Try<A> = s => f => tailRecM_(s, f);

export const recover: <B>(
  f: (e: Error) => B,
) => <A extends B>(t: Try<A>) => Try<B> = f => t => recover_(t, f);

export const recoverWith: <B>(
  f: (e: Error) => Try<B>,
) => <A extends B>(t: Try<A>) => Try<B> = f => t => recoverWith_(t, f);

export const fold: <A, B>(
  onFailure: () => B,
  onSuccess: (a: A) => B,
) => (fa: Try<A>) => B = (onFailure, onSuccess) => fa =>
  fold_(fa, onFailure, onSuccess);

// -- Point-ful operators

export const getOrElse_ = <A>(t: Try<A>, defaultValue: () => A): A =>
  fold_(t, defaultValue, id);

export const map_ = <A, B>(fa: Try<A>, f: (a: A) => B): Try<B> =>
  flatMap_(fa, x => success(f(x)));

export const collect_ = <A, B>(t: Try<A>, f: (a: A) => Option<B>): Try<B> =>
  fold_(t, failure, a =>
    f(a).fold(() => failure(new Error('Predicate does not hold')), success),
  );

export const orElse_ = <A>(l: Try<A>, r: () => Try<A>): Try<A> =>
  fold_(l, () => flatten(of(r)), success);

export const flatMap_ = <A, B>(fa: Try<A>, f: (a: A) => Try<B>): Try<B> => {
  const t = view(fa);
  if (t.tag === 'failure') return t;

  try {
    return f(t.value);
  } catch (e) {
    return failure(e instanceof Error ? e : new Error(`${e}`));
  }
};

export const tailRecM_ = <S, A>(
  s: S,
  f: (s: S) => Try<Either<S, A>>,
): Try<A> => {
  try {
    let cur: Try<Either<S, A>> = f(s);
    let result: Try<A> | undefined;
    while (!result) {
      if (isFailure(cur)) {
        result = cur as any as Try<A>;
        break;
      }

      // prettier-ignore
      get(cur).fold(
        s => { cur = f(s); },
        a => { result = success(a); },
      );
    }
    return result;
  } catch (e) {
    return failure(e instanceof Error ? e : new Error(`${e}`));
  }
};

export const recover_ = <A>(t: Try<A>, f: (e: Error) => A): Try<A> =>
  recoverWith_(t, compose(success, f));

export const recoverWith_ = <A>(t: Try<A>, f: (e: Error) => Try<A>): Try<A> => {
  try {
    return fold_(t, f, success);
  } catch (e) {
    return failure(e instanceof Error ? e : new Error(`${e}`));
  }
};

export const fold_ = <A, B1, B2 = B1>(
  fa: Try<A>,
  onFailure: (e: Error) => B1,
  onSuccess: (a: A) => B2,
): B1 | B2 => {
  const t = view(fa);
  return t.tag === 'failure' ? onFailure(t.error) : onSuccess(t.value);
};
