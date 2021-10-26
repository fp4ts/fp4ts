import { id, Kind, pipe } from '@fp4ts/core';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { FunctionK } from '../../arrow';

import { Either } from '../either';

import { Kleisli } from './algebra';
import { suspend } from './constructors';

export const dimap: <F>(
  F: Functor<F>,
) => <A, C>(
  f: (a: C) => A,
) => <B, D>(g: (a: B) => D) => (fa: Kleisli<F, A, B>) => Kleisli<F, C, D> =
  F => f => g => fa =>
    dimap_(F)(fa, f, g);

export const adapt: <A, AA>(
  f: (a: AA) => A,
) => <F, B>(fa: Kleisli<F, A, B>) => Kleisli<F, AA, B> = f => fa =>
  adapt_(fa, f);

export const adaptF: <F>(
  F: FlatMap<F>,
) => <A, AA>(
  f: (a: AA) => Kind<F, [A]>,
) => <B>(fa: Kleisli<F, A, B>) => Kleisli<F, AA, B> = F => f => fa =>
  adaptF_(F)(fa, f);

export const andThen: <F>(
  F: FlatMap<F>,
) => <B2, C>(
  fb: Kleisli<F, B2, C>,
) => <A, B extends B2>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> =
  F => fb => fa =>
    andThen_(F)(fa, fb);

export const compose: <F>(
  F: FlatMap<F>,
) => <Z, A>(
  fb: Kleisli<F, Z, A>,
) => <B>(fa: Kleisli<F, A, B>) => Kleisli<F, Z, B> = F => fb => fa =>
  compose_(F)(fb, fa);

export const map: <F>(
  F: Functor<F>,
) => <B, C>(f: (b: B) => C) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> =
  F => f => fa =>
    map_(F)(fa, f);

export const tap: <F>(
  F: Functor<F>,
) => <B>(
  f: (b: B) => unknown,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, B> = F => f => fa =>
  tap_(F)(fa, f);

export const ap: <F>(
  F: Apply<F>,
) => <A2, B>(
  fa: Kleisli<F, A2, B>,
) => <A1, C>(ff: Kleisli<F, A1, (b: B) => C>) => Kleisli<F, A1 & A2, C> =
  F => fa => ff =>
    ap_(F)(ff, fa);

export const map2: <F>(
  F: Apply<F>,
) => <A2, B, C, D>(
  fb: Kleisli<F, A2, C>,
  f: (b: B, c: C) => D,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, D> =
  F => (fb, f) => fa =>
    map2_(F)(fa, fb)(f);

export const product: <F>(
  F: Apply<F>,
) => <A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, [B, C]> =
  F => fb => fa =>
    product_(F)(fa, fb);

export const productL: <F>(
  F: Apply<F>,
) => <A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, B> = F => fb => fa =>
  productL_(F)(fa, fb);

export const productR: <F>(
  F: Apply<F>,
) => <A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, C> = F => fb => fa =>
  productR_(F)(fa, fb);

export const flatMap: <F>(
  F: FlatMap<F>,
) => <A2, B, C>(
  f: (b: B) => Kleisli<F, A2, C>,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, C> = F => f => fa =>
  flatMap_(F)(fa, f);

export const flatTap: <F>(
  F: FlatMap<F>,
) => <A2, B>(
  f: (b: B) => Kleisli<F, A2, unknown>,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, B> = F => f => fa =>
  flatTap_(F)(fa, f);

export const flatMapF: <F>(
  F: FlatMap<F>,
) => <B, C>(
  f: (b: B) => Kind<F, [C]>,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> = F => f => fa =>
  flatMapF_(F)(fa, f);

export const flatTapF: <F>(
  F: FlatMap<F>,
) => <B>(
  f: (b: B) => Kind<F, [unknown]>,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, B> = F => f => fa =>
  flatTapF_(F)(fa, f);

export const flatten =
  <F>(F: FlatMap<F>) =>
  <A1, A2, B>(ffa: Kleisli<F, A1, Kleisli<F, A2, B>>): Kleisli<F, A1 & A2, B> =>
    flatMap_(F)(ffa, id);

export const tailRecM: <F>(
  F: Monad<F>,
) => <B>(
  b: B,
) => <A, C>(f: (b: B) => Kleisli<F, A, Either<B, C>>) => Kleisli<F, A, C> =
  F => b => f =>
    tailRecM_(F)(b, f);

export const mapK: <F, G>(
  nt: FunctionK<F, G>,
) => <A, B>(k: Kleisli<F, A, B>) => Kleisli<G, A, B> = nt => k => mapK_(k, nt);

export const lift: <G>(
  G: Applicative<G>,
) => <F, A, B>(k: Kleisli<F, A, B>) => Kleisli<[G, F], A, B> = G => k =>
  lift_(k, G);

// -- Point-ful operators

export const dimap_ =
  <F>(F: Functor<F>) =>
  <A, B, C, D>(
    fa: Kleisli<F, A, B>,
    f: (a: C) => A,
    g: (a: B) => D,
  ): Kleisli<F, C, D> =>
    pipe(fa, adapt(f), map(F)(g));

export const adapt_ = <F, A, AA, B>(
  fa: Kleisli<F, A, B>,
  f: (a: AA) => A,
): Kleisli<F, AA, B> => new Kleisli(a => fa.run(f(a)));

export const adaptF_ =
  <F>(F: FlatMap<F>) =>
  <A, AA, B>(
    fa: Kleisli<F, A, B>,
    f: (a: AA) => Kind<F, [A]>,
  ): Kleisli<F, AA, B> =>
    new Kleisli(a => F.flatMap_(f(a), aa => fa.run(aa)));

export const andThen_ =
  <F>(F: FlatMap<F>) =>
  <A, B, C>(fa: Kleisli<F, A, B>, fb: Kleisli<F, B, C>): Kleisli<F, A, C> =>
    flatMap_(F)(fa, b => adapt_(fb, () => b));

export const compose_ =
  <F>(F: FlatMap<F>) =>
  <Z, A, B>(fb: Kleisli<F, Z, A>, fa: Kleisli<F, A, B>): Kleisli<F, Z, B> =>
    andThen_(F)(fb, fa);

export const map_ =
  <F>(F: Functor<F>) =>
  <A, B, C>(fa: Kleisli<F, A, B>, f: (b: B) => C): Kleisli<F, A, C> =>
    new Kleisli(a => F.map_(fa.run(a), f));

export const tap_ =
  <F>(F: Functor<F>) =>
  <A, B>(fa: Kleisli<F, A, B>, f: (b: B) => unknown): Kleisli<F, A, B> =>
    map_(F)(fa, x => {
      f(x);
      return x;
    });

export const ap_ =
  <F>(F: Apply<F>) =>
  <A1, A2, B, C>(
    ff: Kleisli<F, A1, (b: B) => C>,
    fa: Kleisli<F, A2, B>,
  ): Kleisli<F, A1 & A2, C> =>
    suspend(a => F.ap_(ff.run(a), fa.run(a)));

export const map2_ =
  <F>(F: Apply<F>) =>
  <A1, A2, B, C>(fa: Kleisli<F, A1, B>, fb: Kleisli<F, A2, C>) =>
  <D>(f: (b: B, c: C) => D): Kleisli<F, A1 & A2, D> =>
    suspend(a => F.map2_(fa.run(a), fb.run(a))(f));

export const product_ =
  <F>(F: Apply<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    fb: Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, [B, C]> =>
    suspend(a => F.product_(fa.run(a), fb.run(a)));

export const productL_ =
  <F>(F: Apply<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    fb: Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, B> =>
    suspend(a => F.productL_(fa.run(a), fb.run(a)));

export const productR_ =
  <F>(F: Apply<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    fb: Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, C> =>
    suspend(a => F.productR_(fa.run(a), fb.run(a)));

export const flatMap_ =
  <F>(F: FlatMap<F>) =>
  <A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    f: (b: B) => Kleisli<F, A2, C>,
  ): Kleisli<F, A1 & A2, C> =>
    new Kleisli(a => F.flatMap_(fa.run(a), b => f(b).run(a)));

export const flatMapF_ =
  <F>(F: FlatMap<F>) =>
  <A, B, C>(
    fa: Kleisli<F, A, B>,
    f: (b: B) => Kind<F, [C]>,
  ): Kleisli<F, A, C> =>
    new Kleisli(a => F.flatMap_(fa.run(a), f));

export const flatTap_ =
  <F>(F: FlatMap<F>) =>
  <A1, A2, B>(
    fa: Kleisli<F, A1, B>,
    f: (b: B) => Kleisli<F, A2, unknown>,
  ): Kleisli<F, A1 & A2, B> =>
    flatMap_(F)(fa, x => map_(F)(f(x), () => x));

export const flatTapF_ =
  <F>(F: FlatMap<F>) =>
  <A, B>(
    fa: Kleisli<F, A, B>,
    f: (b: B) => Kind<F, [unknown]>,
  ): Kleisli<F, A, B> =>
    flatMapF_(F)(fa, x => F.map_(f(x), () => x));

export const tailRecM_ =
  <F>(F: Monad<F>) =>
  <A, B, C>(b: B, f: (b: B) => Kleisli<F, A, Either<B, C>>): Kleisli<F, A, C> =>
    new Kleisli(a => F.tailRecM(b)(x => f(x).run(a)));

export const mapK_ = <F, G, A, B>(
  k: Kleisli<F, A, B>,
  nt: FunctionK<F, G>,
): Kleisli<G, A, B> => suspend((a: A) => nt(k.run(a)));

export const lift_: <F, G, A, B>(
  k: Kleisli<F, A, B>,
  G: Applicative<G>,
) => Kleisli<[G, F], A, B> = <F, G, A, B>(
  k: Kleisli<F, A, B>,
  G: Applicative<G>,
): Kleisli<[G, F], A, B> =>
  suspend<[G, F], A, B>((a: A) => G.pure(k.run(a)) as any);
