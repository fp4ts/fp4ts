// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import {
  AndThen,
  Applicative,
  EitherT,
  Functor,
  Monad,
  None,
  Option,
  Some,
} from '@fp4ts/cats';

import { DecodeFailure } from '../decode-failure';
import { DecoderT } from './algebra';
import { fromRefinement } from './constructors';
import { DecodeResultT } from './decode-result-t';

export const refine: <F>(
  F: Monad<F>,
) => <A, B extends A>(
  r: (x: A) => x is B,
) => (d: DecoderT<F, unknown, A>) => DecoderT<F, unknown, B> = F => r => d =>
  refine_(F)(d, r);

export const nullable =
  <F>(F: Applicative<F>) =>
  <A>(d: DecoderT<F, unknown, A>): DecoderT<F, unknown, A | null> =>
    new DecoderT(i =>
      i === null ? DecodeResultT.success(F)(null) : d.decode(i),
    );

export const leftMap: <F>(
  F: Functor<F>,
) => (
  f: (df: DecodeFailure) => DecodeFailure,
) => <I, A>(d: DecoderT<F, I, A>) => DecoderT<F, I, A> = F => f => d =>
  leftMap_(F)(d, f);

export const flatten =
  <F>(F: Monad<F>) =>
  <I, A>(dd: DecoderT<F, I, DecoderT<F, I, A>>): DecoderT<F, I, A> =>
    flatMap_(F)(dd, id);

export const andThen: <F>(
  F: Monad<F>,
) => <A, B>(
  db: DecoderT<F, A, B>,
) => <I>(da: DecoderT<F, I, A>) => DecoderT<F, I, B> = F => db => da =>
  andThen_(F)(da, db);

export function nonEmpty<F>(
  F: Monad<F>,
): (d: DecoderT<F, unknown, string>) => DecoderT<F, unknown, string>;
export function nonEmpty<F>(
  F: Monad<F>,
): <A>(d: DecoderT<F, unknown, A[]>) => DecoderT<F, unknown, A[]>;
export function nonEmpty<F>(
  F: Monad<F>,
): (d: DecoderT<F, unknown, any>) => DecoderT<F, unknown, any> {
  return d => filter_(F)(d, x => x.length > 0, 'non empty');
}

// -- Point-ful operators

export const orElse_ =
  <F>(F: Monad<F>) =>
  <I, A>(
    da: DecoderT<F, I, A>,
    alt: () => DecoderT<F, I, A>,
  ): DecoderT<F, I, A> =>
    new DecoderT(i => da.decode(i).orElse(F)(() => alt().decode(i)));

export const filter_ =
  <F>(F: Monad<F>) =>
  <I, A>(
    d: DecoderT<F, I, A>,
    f: (a: A) => boolean,
    cause?: string,
  ): DecoderT<F, I, A> =>
    collect_(F)(d, a => (f(a) ? Some(a) : None), cause);

export const collect_ =
  <F>(F: Monad<F>) =>
  <I, A, B>(
    d: DecoderT<F, I, A>,
    f: (a: A) => Option<B>,
    cause?: string,
  ): DecoderT<F, I, B> =>
    new DecoderT(
      AndThen(d.decode).andThen(fb =>
        fb.flatMap(F)(b =>
          f(b).fold(
            () => DecodeResultT.failure(F)(new DecodeFailure(Option(cause))),
            DecodeResultT.success(F),
          ),
        ),
      ),
    );

export const dimap_ =
  <F>(F: Functor<F>) =>
  <II, I, A, B>(
    d: DecoderT<F, I, A>,
    f: (ii: II) => I,
    g: (a: A) => B,
  ): DecoderT<F, II, B> =>
    new DecoderT(ii => d.decode(f(ii)).map(F)(g));

export const adapt_ = <F, II, I, A>(
  d: DecoderT<F, I, A>,
  f: (ii: II) => I,
): DecoderT<F, II, A> => new DecoderT(AndThen(f).andThen(d.decode));

export const adaptF_ =
  <F>(F: Monad<F>) =>
  <II, I, A>(
    d: DecoderT<F, I, A>,
    f: (ii: II) => Kind<F, [I]>,
  ): DecoderT<F, II, A> =>
    new DecoderT(ii =>
      EitherT.liftF(F)<I, DecodeFailure>(f(ii)).flatMap(F)(d.decode),
    );

export const bimap_ =
  <F>(F: Functor<F>) =>
  <I, A, B>(
    d: DecoderT<F, I, A>,
    f: (df: DecodeFailure) => DecodeFailure,
    g: (a: A) => B,
  ): DecoderT<F, I, B> =>
    new DecoderT(AndThen(d.decode).andThen(ea => ea.bimap(F)(f, g)));

export const leftMap_ =
  <F>(F: Functor<F>) =>
  <I, A>(
    d: DecoderT<F, I, A>,
    f: (df: DecodeFailure) => DecodeFailure,
  ): DecoderT<F, I, A> =>
    bimap_(F)(d, f, id);

export const map_ =
  <F>(F: Functor<F>) =>
  <I, A, B>(d: DecoderT<F, I, A>, g: (a: A) => B): DecoderT<F, I, B> =>
    bimap_(F)(d, id, g);

export const flatMap_ =
  <F>(F: Monad<F>) =>
  <I, A, B>(
    d: DecoderT<F, I, A>,
    f: (a: A) => DecoderT<F, I, B>,
  ): DecoderT<F, I, B> =>
    new DecoderT(i => d.decode(i).flatMap(F)(x => f(x).decode(i)));

export const andThen_ =
  <F>(F: Monad<F>) =>
  <I, A, B>(da: DecoderT<F, I, A>, db: DecoderT<F, A, B>): DecoderT<F, I, B> =>
    new DecoderT(AndThen(da.decode).andThen(ea => ea.flatMap(F)(db.decode)));

export const compose_ =
  <F>(F: Monad<F>) =>
  <I, A, B>(db: DecoderT<F, A, B>, da: DecoderT<F, I, A>): DecoderT<F, I, B> =>
    andThen_(F)(da, db);

// -- Schema

export const refine_ =
  <F>(F: Monad<F>) =>
  <A, B extends A>(
    d: DecoderT<F, unknown, A>,
    r: (x: A) => x is B,
    cause?: string,
  ): DecoderT<F, unknown, B> =>
    andThen_(F)(d, fromRefinement(F)(r, cause));

export const mapFailure_ =
  <F>(F: Functor<F>) =>
  <I, A>(da: DecoderT<F, I, A>, f: (s: string) => string): DecoderT<F, I, A> =>
    leftMap_(F)(da, df => df.mapCause(f));

export const intersection_ =
  <F>(F: Monad<F>) =>
  <A, B>(
    da: DecoderT<F, unknown, A>,
    db: DecoderT<F, unknown, B>,
  ): DecoderT<F, unknown, A & B> =>
    flatMap_(F)(da, a =>
      map_(F)(db, b => {
        if (
          a !== null &&
          b !== null &&
          typeof a === 'object' &&
          typeof a === 'object'
        ) {
          return { ...a, ...b };
        }
        return b as any;
      }),
    );

export const union_ =
  <F>(F: Monad<F>) =>
  <A, B>(
    da: DecoderT<F, unknown, A>,
    db: DecoderT<F, unknown, B>,
  ): DecoderT<F, unknown, A | B> =>
    orElse_(F)(da as DecoderT<F, unknown, A | B>, () => db);

export const min_ =
  <F>(F: Monad<F>) =>
  (d: DecoderT<F, unknown, number>, n: number): DecoderT<F, unknown, number> =>
    filter_(F)(d, x => x >= n, `>= ${n}`);

export const minExclusive_ =
  <F>(F: Monad<F>) =>
  (d: DecoderT<F, unknown, number>, n: number): DecoderT<F, unknown, number> =>
    filter_(F)(d, x => x > n, `> ${n}`);

export const max_ =
  <F>(F: Monad<F>) =>
  (d: DecoderT<F, unknown, number>, n: number): DecoderT<F, unknown, number> =>
    filter_(F)(d, x => x <= n, `<= ${n}`);

export const maxExclusive_ =
  <F>(F: Monad<F>) =>
  (d: DecoderT<F, unknown, number>, n: number): DecoderT<F, unknown, number> =>
    filter_(F)(d, x => x < n, `< ${n}`);

export function minLength_<F>(
  F: Monad<F>,
): (d: DecoderT<F, unknown, string>, n: number) => DecoderT<F, unknown, string>;
export function minLength_<F>(
  F: Monad<F>,
): <A>(d: DecoderT<F, unknown, A[]>, n: number) => DecoderT<F, unknown, A[]>;
export function minLength_<F>(
  F: Monad<F>,
): (d: DecoderT<F, unknown, any>, n: number) => DecoderT<F, unknown, any> {
  return (d, n) => filter_(F)(d, xs => xs.length >= n, `length >= ${n}`);
}

export function maxLength_<F>(
  F: Monad<F>,
): (d: DecoderT<F, unknown, string>, n: number) => DecoderT<F, unknown, string>;
export function maxLength_<F>(
  F: Monad<F>,
): <A>(d: DecoderT<F, unknown, A[]>, n: number) => DecoderT<F, unknown, A[]>;
export function maxLength_<F>(
  F: Monad<F>,
): (d: DecoderT<F, unknown, any>, n: number) => DecoderT<F, unknown, any> {
  return (d, n) => filter_(F)(d, xs => xs.length <= n, `length <= ${n}`);
}
