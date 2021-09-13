import { FunctionK, Monad } from '../../cats';
import { Intro, Kind, Mix, URIS } from '../../core';
import { FlatMap, Free, view } from './algebra';
import { pure } from './constructors';

export const map =
  <A, B>(f: (a: A) => B) =>
  <F extends URIS, C, S, R, E>(
    self: Free<F, C, S, R, E, A>,
  ): Free<F, C, S, R, E, B> =>
    map_(self, f);

export const flatMap =
  <F extends URIS, C, S2, R2, E2, A, B>(
    f: (a: A) => Free<F, C, S2, R2, E2, B>,
  ) =>
  <S, R, E>(
    self: Free<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      A
    >,
  ): Free<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    B
  > =>
    flatMap_(self, f);

export const mapK =
  <G extends URIS, CG>(G: Monad<G, CG>) =>
  <F extends URIS, C>(nt: FunctionK<F, G, C, CG>) =>
  <S, R, E, A>(free: Free<F, C, S, R, E, A>): Kind<G, CG, S, R, E, A> =>
    mapK_(G)(free, nt);

// Point-ful operators

export const map_ = <F extends URIS, C, S, R, E, A, B>(
  self: Free<F, C, S, R, E, A>,
  f: (a: A) => B,
): Free<F, C, S, R, E, B> => flatMap_(self, x => pure(f(x)));

export const flatMap_ = <F extends URIS, C, S, R, E, A, B>(
  self: Free<F, C, S, R, E, A>,
  f: (a: A) => Free<F, C, S, R, E, B>,
): Free<F, C, S, R, E, B> => new FlatMap(self, f);

export const mapK_ =
  <G extends URIS, CG>(G: Monad<G, CG>) =>
  <F extends URIS, C, S, R, E, A>(
    _free: Free<F, C, S, R, E, A>,
    nt: FunctionK<F, G, C, CG>,
  ): Kind<G, CG, S, R, E, A> => {
    const free = view(_free);
    switch (free.tag) {
      case 'pure':
        return G.pure(free.value);

      case 'suspend':
        return nt(free.fa);

      case 'flatMap':
        return G.flatMap_(mapK_(G)(free.self, nt), e =>
          mapK_(G)(free.f(e), nt),
        );
    }
  };
