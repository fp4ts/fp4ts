import { AnyK, id, Kind, pipe } from '../../../core';
import { FunctionK } from '../../function-k';
import { Monad } from '../../monad';
import { Either, Left, Right } from '../either';

import { FlatMap, Kleisli, Adapt, AdaptF, Pure, view } from './algebra';
import { liftF, pure, suspend } from './constructors';

export const dimap: <A, C>(
  f: (a: C) => A,
) => <B, D>(
  g: (a: B) => D,
) => <F extends AnyK>(fa: Kleisli<F, A, B>) => Kleisli<F, C, D> =
  f => g => fa =>
    dimap_(fa, f, g);

export const adapt: <A, AA>(
  f: (a: AA) => A,
) => <F extends AnyK, B>(fa: Kleisli<F, A, B>) => Kleisli<F, AA, B> = f => fa =>
  adapt_(fa, f);

export const adaptF: <F extends AnyK, A, AA>(
  f: (a: AA) => Kind<F, [A]>,
) => <B>(fa: Kleisli<F, A, B>) => Kleisli<F, AA, B> = f => fa => adaptF_(fa, f);

export const andThen: <F extends AnyK, B2, C>(
  fb: Kleisli<F, B2, C>,
) => <A, B extends B2>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> = fb => fa =>
  andThen_(fa, fb);

export const compose: <F extends AnyK, Z, A>(
  fb: Kleisli<F, Z, A>,
) => <B>(fa: Kleisli<F, A, B>) => Kleisli<F, Z, B> = fb => fa =>
  compose_(fb, fa);

export const map: <B, C>(
  f: (b: B) => C,
) => <F extends AnyK, A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> = f => fa =>
  map_(fa, f);

export const tap: <B>(
  f: (b: B) => unknown,
) => <F extends AnyK, A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, B> = f => fa =>
  tap_(fa, f);

export const ap: <F extends AnyK, A2, B>(
  fa: Kleisli<F, A2, B>,
) => <A1, C>(ff: Kleisli<F, A1, (b: B) => C>) => Kleisli<F, A1 & A2, C> =
  fa => ff =>
    ap_(ff, fa);

export const map2: <F extends AnyK, A2, B, C, D>(
  fb: Kleisli<F, A2, C>,
  f: (b: B, c: C) => D,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, D> = (fb, f) => fa =>
  map2_(fa, fb)(f);

export const product: <F extends AnyK, A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, [B, C]> = fb => fa =>
  product_(fa, fb);

export const productL: <F extends AnyK, A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, B> = fb => fa =>
  productL_(fa, fb);

export const productR: <F extends AnyK, A2, C>(
  fb: Kleisli<F, A2, C>,
) => <A1, B>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, C> = fb => fa =>
  productR_(fa, fb);

export const flatMap: <F extends AnyK, A2, B, C>(
  f: (b: B) => Kleisli<F, A2, C>,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, C> = f => fa =>
  flatMap_(fa, f);

export const flatTap: <F extends AnyK, A2, B>(
  f: (b: B) => Kleisli<F, A2, unknown>,
) => <A1>(fa: Kleisli<F, A1, B>) => Kleisli<F, A1 & A2, B> = f => fa =>
  flatTap_(fa, f);

export const flatMapF: <F extends AnyK, B, C>(
  f: (b: B) => Kind<F, [C]>,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, C> = f => fa =>
  flatMapF_(fa, f);

export const flatTapF: <F extends AnyK, B>(
  f: (b: B) => Kind<F, [unknown]>,
) => <A>(fa: Kleisli<F, A, B>) => Kleisli<F, A, B> = f => fa =>
  flatTapF_(fa, f);

export const flatten = <F extends AnyK, A1, A2, B>(
  ffa: Kleisli<F, A1, Kleisli<F, A2, B>>,
): Kleisli<F, A1 & A2, B> => flatMap_(ffa, id);

export const tailRecM: <B>(
  b: B,
) => <F extends AnyK, A, C>(
  f: (b: B) => Kleisli<F, A, Either<B, C>>,
) => Kleisli<F, A, C> = b => f => tailRecM_(b, f);

export const mapK: <F extends AnyK>(
  M: Monad<F>,
) => <G extends AnyK>(
  nt: FunctionK<F, G>,
) => <A, B>(k: Kleisli<F, A, B>) => Kleisli<G, A, B> = M => nt => k =>
  mapK_(M)(k, nt);

export const run: <F extends AnyK>(
  M: Monad<F>,
) => <A>(a: A) => <B>(k: Kleisli<F, A, B>) => Kind<F, [B]> = M => a => k =>
  run_(M)(k, a);

// -- Point-ful operators

export const dimap_ = <F extends AnyK, A, B, C, D>(
  fa: Kleisli<F, A, B>,
  f: (a: C) => A,
  g: (a: B) => D,
): Kleisli<F, C, D> => pipe(fa, adapt(f), map(g));

export const adapt_ = <F extends AnyK, A, AA, B>(
  fa: Kleisli<F, A, B>,
  f: (a: AA) => A,
): Kleisli<F, AA, B> => new Adapt(fa, f);

export const adaptF_ = <F extends AnyK, A, AA, B>(
  fa: Kleisli<F, A, B>,
  f: (a: AA) => Kind<F, [A]>,
): Kleisli<F, AA, B> => new AdaptF(fa, f);

export const andThen_ = <F extends AnyK, A, B, C>(
  fa: Kleisli<F, A, B>,
  fb: Kleisli<F, B, C>,
): Kleisli<F, A, C> => flatMap_(fa, b => adapt_(fb, () => b));

export const compose_ = <F extends AnyK, Z, A, B>(
  fb: Kleisli<F, Z, A>,
  fa: Kleisli<F, A, B>,
): Kleisli<F, Z, B> => andThen_(fb, fa);

export const map_ = <F extends AnyK, A, B, C>(
  fa: Kleisli<F, A, B>,
  f: (b: B) => C,
): Kleisli<F, A, C> => flatMap_(fa, a => new Pure(f(a)));

export const tap_ = <F extends AnyK, A, B>(
  fa: Kleisli<F, A, B>,
  f: (b: B) => unknown,
): Kleisli<F, A, B> =>
  map_(fa, x => {
    f(x);
    return x;
  });

export const ap_ = <F extends AnyK, A1, A2, B, C>(
  ff: Kleisli<F, A1, (b: B) => C>,
  fa: Kleisli<F, A2, B>,
): Kleisli<F, A1 & A2, C> => flatMap_(ff, f => map_(fa, a => f(a)));

export const map2_ =
  <F extends AnyK, A1, A2, B, C>(
    fa: Kleisli<F, A1, B>,
    fb: Kleisli<F, A2, C>,
  ) =>
  <D>(f: (b: B, c: C) => D): Kleisli<F, A1 & A2, D> =>
    flatMap_(fa, b => map_(fb, c => f(b, c)));

export const product_ = <F extends AnyK, A1, A2, B, C>(
  fa: Kleisli<F, A1, B>,
  fb: Kleisli<F, A2, C>,
): Kleisli<F, A1 & A2, [B, C]> => flatMap_(fa, b => map_(fb, c => [b, c]));

export const productL_ = <F extends AnyK, A1, A2, B, C>(
  fa: Kleisli<F, A1, B>,
  fb: Kleisli<F, A2, C>,
): Kleisli<F, A1 & A2, B> => flatMap_(fa, b => map_(fb, () => b));

export const productR_ = <F extends AnyK, A1, A2, B, C>(
  fa: Kleisli<F, A1, B>,
  fb: Kleisli<F, A2, C>,
): Kleisli<F, A1 & A2, C> => flatMap_(fa, () => map_(fb, c => c));

export const flatMap_ = <F extends AnyK, A1, A2, B, C>(
  fa: Kleisli<F, A1, B>,
  f: (b: B) => Kleisli<F, A2, C>,
): Kleisli<F, A1 & A2, C> => new FlatMap(fa, f);

export const flatMapF_ = <F extends AnyK, A, B, C>(
  fa: Kleisli<F, A, B>,
  f: (b: B) => Kind<F, [C]>,
): Kleisli<F, A, C> => flatMap_(fa, b => liftF(f(b)));

export const flatTap_ = <F extends AnyK, A1, A2, B>(
  fa: Kleisli<F, A1, B>,
  f: (b: B) => Kleisli<F, A2, unknown>,
): Kleisli<F, A1 & A2, B> => flatMap_(fa, x => map_(f(x), () => x));

export const flatTapF_ = <F extends AnyK, A, B>(
  fa: Kleisli<F, A, B>,
  f: (b: B) => Kind<F, [unknown]>,
): Kleisli<F, A, B> => flatTap_(fa, b => liftF(f(b)));

export const tailRecM_ = <F extends AnyK, A, B, C>(
  b: B,
  f: (b: B) => Kleisli<F, A, Either<B, C>>,
): Kleisli<F, A, C> =>
  flatMap_(f(b), bc =>
    bc.fold(
      b => tailRecM_(b, f),
      c => pure(c),
    ),
  );

export const mapK_ =
  <F extends AnyK>(M: Monad<F>) =>
  <G extends AnyK, A, B>(
    k: Kleisli<F, A, B>,
    nt: FunctionK<F, G>,
  ): Kleisli<G, A, B> =>
    suspend((a: A) => nt(run_(M)(k, a)));

export const run_ = <F extends AnyK>(
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
        case 'flatMap':
          return M.map_(loop(v.self, a), e => Left([v.f(e), a]));
      }
    });
  return loop;
};
