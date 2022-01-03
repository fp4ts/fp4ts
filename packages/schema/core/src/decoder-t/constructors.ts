// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, pipe, tupled } from '@fp4ts/core';
import {
  Applicative,
  Array as CatsArray,
  Either,
  EitherT,
  Functor,
  Monad,
  None,
  Option,
  Some,
} from '@fp4ts/cats';
import { Guard } from '@fp4ts/schema-kernel';
import { Literal } from '@fp4ts/schema-kernel/lib/literal';

import { DecodeFailure } from '../decode-failure';
import { DecoderT } from './algebra';
import { DecodeResultT } from './decode-result-t';
import { andThen, mapFailure_ } from './operators';

export const succeed =
  <F>(F: Applicative<F>) =>
  <A, I = unknown>(x: A): DecoderT<F, I, A> =>
    new DecoderT(() => DecodeResultT.success(F)(x));

export const succeedT =
  <F>(F: Functor<F>) =>
  <A, I = unknown>(fa: Kind<F, [A]>): DecoderT<F, I, A> =>
    new DecoderT(() => DecodeResultT.successT(F)(fa));

export const fail =
  <F>(F: Applicative<F>) =>
  <A = never, I = unknown>(e: DecodeFailure): DecoderT<F, I, A> =>
    new DecoderT(() => DecodeResultT.failure(F)(e));

export const failT =
  <F>(F: Functor<F>) =>
  <A = never, I = unknown>(fe: Kind<F, [DecodeFailure]>): DecoderT<F, I, A> =>
    new DecoderT(() => DecodeResultT.failureT(F)(fe));

export const failWith =
  <F>(F: Applicative<F>) =>
  <A = never, I = unknown>(cause: Option<string> = None): DecoderT<F, I, A> =>
    fail(F)(new DecodeFailure(cause));

export const identity =
  <F>(F: Applicative<F>) =>
  <A>(): DecoderT<F, A, A> =>
    new DecoderT(DecodeResultT.success(F));

export const empty =
  <F>(F: Applicative<F>) =>
  <A = never>(): DecoderT<F, unknown, A> =>
    new DecoderT(() => DecodeResultT.failure(F)(new DecodeFailure()));

export const tailRecM =
  <F>(F: Monad<F>) =>
  <S>(s0: S) =>
  <I, A>(f: (s: S) => DecoderT<F, I, Either<S, A>>): DecoderT<F, I, A> =>
    tailRecM_(F)(s0, f);

export const tailRecM_ =
  <F>(F: Monad<F>) =>
  <S, I, A>(
    s0: S,
    f: (s: S) => DecoderT<F, I, Either<S, A>>,
  ): DecoderT<F, I, A> =>
    new DecoderT(i =>
      EitherT.Monad<F, DecodeFailure>(F).tailRecM(s0)(s => f(s).decode(i)),
    );

// -- Schema specific

export const fromRefinement =
  <F>(F: Applicative<F>) =>
  <I, A extends I>(r: (i: I) => i is A, expected?: string): DecoderT<F, I, A> =>
    new DecoderT(i =>
      r(i)
        ? DecodeResultT.success(F)(i)
        : DecodeResultT.failure(F)(new DecodeFailure(Option(expected))),
    );

export const fromGuard =
  <F>(F: Applicative<F>) =>
  <I, A extends I>(g: Guard<I, A>, expected?: string): DecoderT<F, I, A> =>
    fromRefinement(F)(g.test, expected);

export const literal =
  <F>(F: Applicative<F>) =>
  <A extends [Literal, ...Literal[]]>(
    ...xs: A
  ): DecoderT<F, unknown, A[number]> =>
    fromGuard(F)(Guard.literal(...xs), xs.map(x => `${x}`).join(' | '));

export const boolean = <F>(F: Applicative<F>): DecoderT<F, unknown, boolean> =>
  fromGuard(F)(Guard.boolean, 'boolean');

export const number = <F>(F: Applicative<F>): DecoderT<F, unknown, number> =>
  fromGuard(F)(Guard.number, 'number');

export const string = <F>(F: Applicative<F>): DecoderT<F, unknown, string> =>
  fromGuard(F)(Guard.string, 'string');

export const nullDecoderT = <F>(
  F: Applicative<F>,
): DecoderT<F, unknown, null> => fromGuard(F)(Guard.null, 'null');

export const unknownArray = <F>(
  F: Applicative<F>,
): DecoderT<F, unknown, unknown[]> => fromRefinement(F)(Array.isArray, 'array');

export const unknownRecord = <F>(
  F: Applicative<F>,
): DecoderT<F, unknown, Record<string, unknown>> =>
  fromRefinement(F)(
    (x: unknown): x is Record<string, unknown> =>
      x !== null && typeof x === 'object' && !Array.isArray(x),
    'record',
  );

export const array =
  <F>(F: Monad<F>) =>
  <A>(da: DecoderT<F, unknown, A>): DecoderT<F, unknown, A[]> =>
    pipe(
      unknownArray(F),
      andThen(F)(
        new DecoderT(xs =>
          pipe(
            zipWithIndex(xs),
            traverse(EitherT.Monad<F, DecodeFailure>(F))(([x, idx]) =>
              mapFailure_(F)(da, f => `${f} at index ${idx}`).decode(x),
            ),
          ),
        ),
      ),
    );

export const record =
  <F>(F: Monad<F>) =>
  <A>(ds: DecoderT<F, unknown, A>): DecoderT<F, unknown, Record<string, A>> =>
    pipe(
      unknownRecord(F),
      andThen(F)(
        new DecoderT(xs =>
          pipe(
            Object.keys(xs),
            traverse(EitherT.Monad<F, DecodeFailure>(F))(k => {
              return mapFailure_(F)(ds, f => `${f} at key ${k}`)
                .decode(xs[k as string])
                .map(F)(r => tupled(r, k));
            }),
          ).map(F)(rs =>
            rs.reduce(
              (acc, [x, k]) => ({ ...acc, [k]: x }),
              {} as Record<string, A>,
            ),
          ),
        ),
      ),
    );

export const struct =
  <F>(F: Monad<F>) =>
  <A extends {}>(ds: { [k in keyof A]: DecoderT<F, unknown, A[k]> }): DecoderT<
    F,
    unknown,
    A
  > =>
    pipe(
      unknownRecord(F),
      andThen(F)(
        new DecoderT(xs =>
          pipe(
            Object.keys(ds) as (keyof A)[],
            traverse(EitherT.Monad<F, DecodeFailure>(F))(k => {
              if (!(k in xs))
                return DecodeResultT.failure(F)(
                  new DecodeFailure(Some(`missing property '${k}'`)),
                );

              return mapFailure_(F)(ds[k], f => `${f} at key '${k}'`)
                .decode(xs[k as string])
                .map(F)(r => tupled(r, k));
            }),
          ).map(F)(rs =>
            rs.reduce((acc, [x, k]) => ({ ...acc, [k]: x }), {} as A),
          ),
        ),
      ),
    );

export const partial =
  <F>(F: Monad<F>) =>
  <A extends {}>(ds: { [k in keyof A]: DecoderT<F, unknown, A[k]> }): DecoderT<
    F,
    unknown,
    Partial<A>
  > =>
    pipe(
      unknownRecord(F),
      andThen(F)(
        new DecoderT(xs =>
          pipe(
            Object.keys(ds) as (keyof A)[],
            traverse(EitherT.Monad<F, DecodeFailure>(F))(k => {
              if (!(k in xs)) return DecodeResultT.success(F)(None);

              return mapFailure_(F)(ds[k], f => `'${f}' at key '${k}'`)
                .decode(xs[k as string])
                .map(F)(r => Some(tupled(r, k)));
            }),
          ).map(F)(rs =>
            rs.reduce(
              (acc, kxs) =>
                kxs.fold(
                  () => acc,
                  ([x, k]) => ({ ...acc, [k]: x }),
                ),
              {} as Partial<A>,
            ),
          ),
        ),
      ),
    );

export const product =
  <F>(F: Monad<F>) =>
  <A extends unknown[]>(
    ...ds: { [k in keyof A]: DecoderT<F, unknown, A[k]> }
  ): DecoderT<F, unknown, A> =>
    pipe(
      unknownArray(F),
      andThen(F)(
        fromRefinement(F)(
          (xs: unknown[]): xs is unknown[] => xs.length === ds.length,
          'Length mismatch',
        ),
      ),
      andThen(F)(
        new DecoderT(xs =>
          pipe(
            zipWithIndex(xs),
            traverse(EitherT.Monad<F, DecodeFailure>(F))(([x, idx]) =>
              ds[idx].decode(x),
            ),
            x => x as EitherT<F, DecodeFailure, A>,
          ),
        ),
      ),
    );

export const sum =
  <F>(F: Monad<F>) =>
  <T extends string>(tag: T) =>
  <A extends {}>(ds: {
    [k in keyof A]: DecoderT<F, unknown, A[k] & Record<T, k>>;
  }): DecoderT<F, unknown, A[keyof A]> =>
    pipe(
      unknownRecord(F),
      andThen(F)(
        new DecoderT(x => {
          const t = x[tag] as keyof A;
          if (!t)
            return DecodeResultT.failure(F)(
              new DecodeFailure(Some('Missing tag')),
            );
          if (!(t in ds))
            return DecodeResultT.failure(F)(
              new DecodeFailure(Some(`Invalid tag '${tag}'`)),
            );
          return ds[t].decode(x);
        }),
      ),
    );

export const defer = <F, A>(
  thunk: () => DecoderT<F, unknown, A>,
): DecoderT<F, unknown, A> => new DecoderT(i => thunk().decode(i));

// -- Utils

const zipWithIndex = <A>(xs: A[]): [A, number][] =>
  xs.map((x, idx) => [x, idx]);

const { traverse } = CatsArray.Traversable();
