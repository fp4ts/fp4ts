import { $, AnyK, id, Kind, pipe, α, λ } from '@cats4ts/core';
import {
  Applicative,
  Functor,
  FlatMap,
  Monad,
  FunctionK,
} from '@cats4ts/cats-core';

import { Either, Left, Right } from '../either';

import { FlatMapK, Kleisli, Adapt, AdaptF, view, Map } from './algebra';
import { liftF, pure, suspend } from './constructors';

export const dimap: <F extends AnyK>(
  F: Functor<F>,
) => <A, C>(
  f: (a: C) => A,
) => <B, D>(g: (a: B) => D) => (fa: Kleisli<F, A, B>) => Kleisli<F, C, D> =
  F => f => g => fa =>
    dimap_(F)(fa, f, g);

export const adapt: <A, AA>(
  f: (a: AA) => A,
) => <F extends AnyK, B>(fa: Kleisli<F, A, B>) => Kleisli<F, AA, B> = f => fa =>
  adapt_(fa, f);

export const adaptF: <F extends AnyK>(
  F: FlatMap<F>,
) => <A, AA>(
  f: (a: AA) => Kind<F, [A]>,
) => <B>(fa: Kleisli<F, A, B>) => Kleisli<F, AA, B> = F => f => fa =>
  adaptF_(F)(fa, f);

export const andThen: <F extends AnyK>(
  F: FlatMap<F>,
) => <B2, C>(
  fb: Kleisli<F, B2, C>,
) => <A, B extends B2>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> =
  F => fb => fa =>
    andThen_(F)(fa, fb);

export const compose: <F extends AnyK>(
  F: FlatMap<F>,
) => <Z, A>(
  fb: Kleisli<F, Z, A>,
) => <B>(fa: Kleisli<F, A, B>) => Kleisli<F, Z, B> = F => fb => fa =>
  compose_(F)(fb, fa);

export const map: <F extends AnyK>(
  F: Functor<F>,
) => <B, C>(f: (b: B) => C) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> =
  F => f => fa =>
    map_(F)(fa, f);

export const tap: <F extends AnyK>(
  F: Functor<F>,
) => <B>(
  f: (b: B) => unknown,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, B> = F => f => fa =>
  tap_(F)(fa, f);

export const ap: <F extends AnyK>(
  F: FlatMap<F>,
) => <A2, B>(
  fa: Kleisli<F, A2, B>,
) => <A1, C>(ff: Kleisli<F, A1, (b: B) => C>) => Kleisli<F, A1 & A2, C> =
  F => fa => ff =>
    ap_(F)(ff, fa);

export const map2: <F extends AnyK>(
  F: FlatMap<F>,
) => <A2, B, C, D>(
  fb: Kleisli<F, A2, C>,
  f: (b: B, c: C) => D,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, D> =
  F => (fb, f) => fa =>
    map2_(F)(fa, fb)(f);

export const product: <F extends AnyK>(
  F: FlatMap<F>,
) => <A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, [B, C]> =
  F => fb => fa =>
    product_(F)(fa, fb);

export const productL: <F extends AnyK>(
  F: FlatMap<F>,
) => <A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, B> = F => fb => fa =>
  productL_(F)(fa, fb);

export const productR: <F extends AnyK>(
  F: FlatMap<F>,
) => <A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, C> = F => fb => fa =>
  productR_(F)(fa, fb);

export const flatMap: <F extends AnyK>(
  F: FlatMap<F>,
) => <A2, B, C>(
  f: (b: B) => Kleisli<F, A2, C>,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, C> = F => f => fa =>
  flatMap_(F)(fa, f);

export const flatTap: <F extends AnyK>(
  F: FlatMap<F>,
) => <A2, B>(
  f: (b: B) => Kleisli<F, A2, unknown>,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, B> = F => f => fa =>
  flatTap_(F)(fa, f);

export const flatMapF: <F extends AnyK>(
  F: FlatMap<F>,
) => <B, C>(
  f: (b: B) => Kind<F, [C]>,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> = F => f => fa =>
  flatMapF_(F)(fa, f);

export const flatTapF: <F extends AnyK>(
  F: FlatMap<F>,
) => <B>(
  f: (b: B) => Kind<F, [unknown]>,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, B> = F => f => fa =>
  flatTapF_(F)(fa, f);

export const flatten =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B>(ffa: Kleisli<F, A1, Kleisli<F, A2, B>>): Kleisli<F, A1 & A2, B> =>
    flatMap_(F)(ffa, id);

export const tailRecM: <F extends AnyK>(
  F: Monad<F>,
) => <B>(
  b: B,
) => <A, C>(f: (b: B) => Kleisli<F, A, Either<B, C>>) => Kleisli<F, A, C> =
  F => b => f =>
    tailRecM_(F)(b, f);

export const mapK: <F extends AnyK, G extends AnyK>(
  nt: FunctionK<F, G>,
) => <A, B>(k: Kleisli<F, A, B>) => Kleisli<G, A, B> = nt => k => mapK_(k, nt);

export const lift: <G extends AnyK>(
  G: Applicative<G>,
) => <F extends AnyK, A, B>(
  k: Kleisli<F, A, B>,
) => Kleisli<λ<[α], $<G, [$<F, [α]>]>>, A, B> = G => k => lift_(k, G);

export const run: <A>(
  a: A,
) => <F extends AnyK, B>(k: Kleisli<F, A, B>) => Kind<F, [B]> = a => k =>
  run_(k, a);

export const runM: <F extends AnyK>(
  M: Monad<F>,
) => <A>(a: A) => <B>(k: Kleisli<F, A, B>) => Kind<F, [B]> = M => a => k =>
  runM_(M)(k, a);

// -- Point-ful operators

export const dimap_ =
  <F extends AnyK>(F: Functor<F>) =>
  <A, B, C, D>(
    fa: Kleisli<F, A, B>,
    f: (a: C) => A,
    g: (a: B) => D,
  ): Kleisli<F, C, D> =>
    pipe(fa, adapt(f), map(F)(g));

export const adapt_ = <F extends AnyK, A, AA, B>(
  fa: Kleisli<F, A, B>,
  f: (a: AA) => A,
): Kleisli<F, AA, B> => new Adapt(fa, f);

export const adaptF_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A, AA, B>(
    fa: Kleisli<F, A, B>,
    f: (a: AA) => Kind<F, [A]>,
  ): Kleisli<F, AA, B> =>
    new AdaptF(F, fa, f);

export const andThen_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A, B, C>(fa: Kleisli<F, A, B>, fb: Kleisli<F, B, C>): Kleisli<F, A, C> =>
    flatMap_(F)(fa, b => adapt_(fb, () => b));

export const compose_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <Z, A, B>(fb: Kleisli<F, Z, A>, fa: Kleisli<F, A, B>): Kleisli<F, Z, B> =>
    andThen_(F)(fb, fa);

export const map_ =
  <F extends AnyK>(F: Functor<F>) =>
  <A, B, C>(fa: Kleisli<F, A, B>, f: (b: B) => C): Kleisli<F, A, C> =>
    new Map(F, fa, f);

export const tap_ =
  <F extends AnyK>(F: Functor<F>) =>
  <A, B>(fa: Kleisli<F, A, B>, f: (b: B) => unknown): Kleisli<F, A, B> =>
    map_(F)(fa, x => {
      f(x);
      return x;
    });

export const ap_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B, C>(
    ff: Kleisli<F, A1, (b: B) => C>,
    fa: Kleisli<F, A2, B>,
  ): Kleisli<F, A1 & A2, C> =>
    flatMap_(F)(ff, f => map_(F)(fa, a => f(a)));

export const map2_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B, C>(fa: Kleisli<F, A1, B>, fb: Kleisli<F, A2, C>) =>
  <D>(f: (b: B, c: C) => D): Kleisli<F, A1 & A2, D> =>
    flatMap_(F)(fa, b => map_(F)(fb, c => f(b, c)));

export const product_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    fb: Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, [B, C]> =>
    flatMap_(F)(fa, b => map_(F)(fb, c => [b, c]));

export const productL_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    fb: Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, B> =>
    flatMap_(F)(fa, b => map_(F)(fb, () => b));

export const productR_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    fb: Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, C> =>
    flatMap_(F)(fa, () => map_(F)(fb, c => c));

export const flatMap_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    f: (b: B) => Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, C> =>
    new FlatMapK(F, fa, f);

export const flatMapF_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A, B, C>(
    fa: Kleisli<F, A, B>,
    f: (b: B) => Kind<F, [C]>,
  ): Kleisli<F, A, C> =>
    flatMap_(F)(fa, b => liftF(f(b)));

export const flatTap_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A1, A2, B>(
    fa: Kleisli<F, A1, B>,
    f: (b: B) => Kleisli<F, A2, unknown>,
  ): Kleisli<F, A1 & A2, B> =>
    flatMap_(F)(fa, x => map_(F)(f(x), () => x));

export const flatTapF_ =
  <F extends AnyK>(F: FlatMap<F>) =>
  <A, B>(
    fa: Kleisli<F, A, B>,
    f: (b: B) => Kind<F, [unknown]>,
  ): Kleisli<F, A, B> =>
    flatTap_(F)(fa, b => liftF(f(b)));

export const tailRecM_ =
  <F extends AnyK>(F: Monad<F>) =>
  <A, B, C>(b: B, f: (b: B) => Kleisli<F, A, Either<B, C>>): Kleisli<F, A, C> =>
    flatMap_(F)(f(b), bc =>
      bc.fold(
        b => tailRecM_(F)(b, f),
        c => pure(F)(c),
      ),
    );

export const mapK_ = <F extends AnyK, G extends AnyK, A, B>(
  k: Kleisli<F, A, B>,
  nt: FunctionK<F, G>,
): Kleisli<G, A, B> => suspend((a: A) => nt(run_(k, a)));

export const lift_: <F extends AnyK, G extends AnyK, A, B>(
  k: Kleisli<F, A, B>,
  G: Applicative<G>,
) => Kleisli<λ<[α], $<G, [$<F, [α]>]>>, A, B> = <
  F extends AnyK,
  G extends AnyK,
  A,
  B,
>(
  k: Kleisli<F, A, B>,
  G: Applicative<G>,
): Kleisli<λ<[α], $<G, [$<F, [α]>]>>, A, B> =>
  suspend<λ<[α], $<G, [$<F, [α]>]>>, A, B>((a: A) => G.pure(run_(k, a)) as any);

export const run_ = <F extends AnyK, A, B>(
  k: Kleisli<F, A, B>,
  a: A,
): Kind<F, [B]> => {
  const v = view(k);
  switch (v.tag) {
    case 'identity':
      return v.F.pure(a);

    case 'pure':
      return v.F.pure(v.value);

    case 'suspend':
      return v.f(a);

    case 'adapt':
      return run_(v.self, v.f(a));

    case 'adaptF':
      return v.F.flatMap_(v.f(a), aa => run_(v.self, aa));

    case 'map':
      return v.F.map_(run_(v.self, a), b => v.f(b));

    case 'flatMap':
      return v.F.flatMap_(run_(v.self, a), b => run_(v.f(b), a));
  }
};

export const runM_ = <F extends AnyK>(
  M: Monad<F>,
): (<A, B>(k: Kleisli<F, A, B>, a: A) => Kind<F, [B]>) => {
  const loop = <A, B>(k: Kleisli<F, A, B>, a: A): Kind<F, [B]> =>
    M.tailRecM([k, a] as [Kleisli<F, A, B>, A])(([k, a]) => {
      const v = view(k);
      switch (v.tag) {
        case 'identity':
          return M.pure(Right(a));
        case 'pure':
          return M.pure(Right(v.value));
        case 'suspend':
          return M.map_(v.f(a), Right);
        case 'adapt':
          return M.pure(Left([v.self, v.f(a)]));
        case 'adaptF':
          return M.map_(v.f(a), aa => Left([v.self, aa]));
        case 'map':
          return M.map_(loop(v.self, a), b => Right([v.f(b)]));
        case 'flatMap':
          return M.map_(loop(v.self, a), e => Left([v.f(e), a]));
      }
    });
  return loop;
};
