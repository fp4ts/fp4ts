import { id } from '@fp4ts/core';

import { Either } from '../either';

import { pure } from './constructors';
import { Identity } from './identity';

export const map: <A, B>(f: (a: A) => B) => (fa: Identity<A>) => Identity<B> =
  f => fa =>
    map_(fa, f);

export const tap: <A>(
  f: (a: A) => unknown,
) => (fa: Identity<A>) => Identity<A> = f => fa => tap_(fa, f);

export const flatMap: <A, B>(
  f: (a: A) => Identity<B>,
) => (fa: Identity<A>) => Identity<B> = f => fa => flatMap_(fa, f);

export const flatTap: <A>(
  f: (a: A) => Identity<unknown>,
) => (fa: Identity<A>) => Identity<A> = f => fa => flatTap_(fa, f);

export const flatten: <A>(ffa: Identity<Identity<A>>) => Identity<A> = ffa =>
  flatMap_(ffa, id);

export const tailRecM: <A>(
  a: A,
) => <B>(f: (a: A) => Identity<Either<A, B>>) => Identity<B> = a => f =>
  tailRecM_(a, f);

// -- Point-ful operators

export const map_ = <A, B>(fa: Identity<A>, f: (a: A) => B): Identity<B> =>
  pure(f(fa));

export const tap_ = <A>(fa: Identity<A>, f: (a: A) => unknown): Identity<A> => {
  f(fa);
  return fa;
};

export const flatMap_ = <A, B>(
  fa: Identity<A>,
  f: (a: A) => Identity<B>,
): Identity<B> => f(fa);

export const flatTap_ = <A>(
  fa: Identity<A>,
  f: (a: A) => Identity<unknown>,
): Identity<A> => {
  f(fa);
  return fa;
};

export const tailRecM_ = <A, B>(
  a: A,
  f: (a: A) => Identity<Either<A, B>>,
): Identity<B> => {
  let cur: Either<A, B> = f(a);
  let resolved: boolean = false;
  let result: B;

  while (!resolved) {
    cur.fold(
      a => {
        cur = f(a);
      },
      b => {
        resolved = true;
        result = b;
      },
    );
  }

  return pure(result!);
};
