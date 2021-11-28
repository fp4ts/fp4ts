// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK, Monad } from '@fp4ts/cats-core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';

import { FlatMap, Free, view } from './algebra';
import { pure } from './constructors';

export const map =
  <A, B>(f: (a: A) => B) =>
  <F>(self: Free<F, A>): Free<F, B> =>
    map_(self, f);

export const flatMap =
  <F, A, B>(f: (a: A) => Free<F, B>) =>
  (self: Free<F, A>): Free<F, B> =>
    flatMap_(self, f);

export const tailRecM: <A, B>(
  a: A,
) => <F, B>(f: (a: A) => Free<F, Either<A, B>>) => Free<F, B> = a => f =>
  tailRecM_(a, f);

export const mapK =
  <G>(G: Monad<G>) =>
  <F>(nt: FunctionK<F, G>) =>
  <A>(free: Free<F, A>): Kind<G, [A]> =>
    mapK_(G)(free, nt);

// Point-ful operators

export const map_ = <F, A, B>(self: Free<F, A>, f: (a: A) => B): Free<F, B> =>
  flatMap_(self, x => pure(f(x)));

export const flatMap_ = <F, A, B>(
  self: Free<F, A>,
  f: (a: A) => Free<F, B>,
): Free<F, B> => new FlatMap(self, f);

export const tailRecM_ = <F, A, B>(
  a: A,
  f: (a: A) => Free<F, Either<A, B>>,
): Free<F, B> => flatMap_(f(a), ea => ea.fold(a => tailRecM_(a, f), pure));

export const mapK_ =
  <G>(G: Monad<G>) =>
  <F, A>(fr: Free<F, A>, nt: FunctionK<F, G>): Kind<G, [A]> =>
    G.tailRecM(fr)(_free => {
      const free = view(_free);

      switch (free.tag) {
        case 'pure':
          return G.pure(Right(free.value));

        case 'suspend':
          return G.map_(nt(free.fa), a => Right(a));

        case 'flatMap':
          return G.map_(mapK_(G)(free.self, nt), cc => Left(free.f(cc)));
      }
    });
