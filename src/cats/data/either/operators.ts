import { id } from '../../../fp/core';
import { None, Option, Some } from '../option';
import { Either, view } from './algebra';
import { left, right } from './constructors';

export const fold: <E, A, B>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => (ea: Either<E, A>) => B = (onLeft, onRight) => ea =>
  fold_(ea, onLeft, onRight);

export const isEmpty = <E, A>(ea: Either<E, A>): boolean =>
  fold_(
    ea,
    () => true,
    () => false,
  );

export const nonEmpty = <E, A>(ea: Either<E, A>): boolean => !isEmpty(ea);

export const map: <A, B>(
  f: (a: A) => B,
) => <E>(ea: Either<E, A>) => Either<E, B> = f => ea => map_(ea, f);

export const tap: <A>(
  f: (a: A) => unknown,
) => <E>(ea: Either<E, A>) => Either<E, A> = f => ea => tap_(ea, f);

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

export const swapped = <E, A>(ea: Either<E, A>): Either<A, E> =>
  fold_<E, A, Either<A, E>>(ea, right, left);

export const toOption = <A>(ea: Either<unknown, A>): Option<A> =>
  fold_(ea, () => None, Some);

// -- Point-ful operators

export const map_ = <E, A, B>(ea: Either<E, A>, f: (a: A) => B): Either<E, B> =>
  fold_<E, A, Either<E, B>>(ea, left, x => right(f(x)));

export const tap_ = <E, A>(
  ea: Either<E, A>,
  f: (a: A) => unknown,
): Either<E, A> =>
  map_(ea, x => {
    f(x);
    return x;
  });

export const flatMap_ = <E, A, B>(
  ea: Either<E, A>,
  f: (a: A) => Either<E, B>,
): Either<E, B> => fold_(ea, left, x => f(x));

export const flatTap_ = <E, A>(
  ea: Either<E, A>,
  f: (a: A) => Either<E, unknown>,
): Either<E, A> => fold_(ea, left, x => map_(f(x), () => x));

export const fold_ = <E, A, B>(
  ea: Either<E, A>,
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
): B => {
  const v = view(ea);
  if (v.tag === 'right') {
    return onRight(v.value);
  } else {
    return onLeft(v.value);
  }
};
