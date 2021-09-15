import { FunctionK, Monad } from '../../cats';
import { Left, Right } from '../../cats/data';
import { AnyK, Kind } from '../../core';
import { FlatMap, Free, view } from './algebra';
import { pure } from './constructors';

export const map =
  <A, B>(f: (a: A) => B) =>
  <F extends AnyK>(self: Free<F, A>): Free<F, B> =>
    map_(self, f);

export const flatMap =
  <F extends AnyK, A, B>(f: (a: A) => Free<F, B>) =>
  <S, R, E>(self: Free<F, A>): Free<F, B> =>
    flatMap_(self, f);

export const mapK =
  <G extends AnyK>(G: Monad<G>) =>
  <F extends AnyK>(nt: FunctionK<F, G>) =>
  <A>(free: Free<F, A>): Kind<G, [A]> =>
    mapK_(G)(free, nt);

// Point-ful operators

export const map_ = <F extends AnyK, A, B>(
  self: Free<F, A>,
  f: (a: A) => B,
): Free<F, B> => flatMap_(self, x => pure(f(x)));

export const flatMap_ = <F extends AnyK, A, B>(
  self: Free<F, A>,
  f: (a: A) => Free<F, B>,
): Free<F, B> => new FlatMap(self, f);

export const mapK_ =
  <G extends AnyK>(G: Monad<G>) =>
  <F extends AnyK, A>(fr: Free<F, A>, nt: FunctionK<F, G>): Kind<G, [A]> =>
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
