// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import {
  Applicative,
  Category,
  Either,
  EitherT,
  Functor,
  Monad,
  MonoidK,
  Option,
  Profunctor,
} from '@fp4ts/cats';
import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Constraining, Guard, Refining, Schemable } from '@fp4ts/schema-kernel';
import { Literal } from '@fp4ts/schema-kernel/lib/literal';
import { DecodeFailure } from '../decode-failure';
import { DecoderT as DecoderTBase } from './algebra';
import {
  array,
  boolean,
  defer,
  empty,
  fail,
  failT,
  failWith,
  fromGuard,
  fromRefinement,
  identity,
  literal,
  nullDecoderT,
  number,
  partial,
  product,
  record,
  string,
  struct,
  succeed,
  succeedT,
  sum,
  tailRecM,
  tailRecM_,
  unknownArray,
  unknownRecord,
} from './constructors';
import {
  decoderTCategory,
  decoderTConstraining,
  decoderTFunctor,
  decoderTMonad,
  decoderTMonoidK,
  decoderTProfunctor,
  decoderTRefining,
  decoderTSchemable,
} from './instances';

export type DecoderT<F, I, A> = DecoderTBase<F, I, A>;

export const DecoderT: DecoderTObj = function (f) {
  return new DecoderTBase(f);
};

interface DecoderTObj {
  <F, I, A>(f: (i: I) => EitherT<F, DecodeFailure, A>): DecoderT<F, I, A>;
  succeed<F>(F: Applicative<F>): <A, I = unknown>(x: A) => DecoderT<F, I, A>;
  succeedT<F>(
    F: Functor<F>,
  ): <A, I = unknown>(fa: Kind<F, [A]>) => DecoderT<F, I, A>;
  fail<F>(
    F: Applicative<F>,
  ): <A = never, I = unknown>(e: DecodeFailure) => DecoderT<F, I, A>;
  failT<F>(
    F: Functor<F>,
  ): <A = never, I = unknown>(
    fe: Kind<F, [DecodeFailure]>,
  ) => DecoderT<F, I, A>;
  failWith<F>(
    F: Applicative<F>,
  ): <A = never, I = unknown>(cause?: Option<string>) => DecoderT<F, I, A>;
  identity<F>(F: Applicative<F>): <A>() => DecoderT<F, A, A>;
  empty<F>(F: Applicative<F>): <A = never>() => DecoderT<F, unknown, A>;
  tailRecM<F>(
    F: Monad<F>,
  ): <S>(
    s0: S,
  ) => <I, A>(f: (s: S) => DecoderT<F, I, Either<S, A>>) => DecoderT<F, I, A>;
  tailRecM_<F>(
    F: Monad<F>,
  ): <S, I, A>(
    s0: S,
    f: (s: S) => DecoderT<F, I, Either<S, A>>,
  ) => DecoderT<F, I, A>;

  // -- Schema specific
  fromRefinement<F>(
    F: Applicative<F>,
  ): <I, A extends I>(
    r: (i: I) => i is A,
    expected?: string,
  ) => DecoderT<F, I, A>;
  fromGuard<F>(
    F: Applicative<F>,
  ): <I, A extends I>(g: Guard<I, A>, expected?: string) => DecoderT<F, I, A>;
  literal<F>(
    F: Applicative<F>,
  ): <A extends [Literal, ...Literal[]]>(
    ...xs: A
  ) => DecoderT<F, unknown, A[number]>;
  boolean<F>(F: Applicative<F>): DecoderT<F, unknown, boolean>;
  number<F>(F: Applicative<F>): DecoderT<F, unknown, number>;
  string<F>(F: Applicative<F>): DecoderT<F, unknown, string>;
  nullDecoderT<F>(F: Applicative<F>): DecoderT<F, unknown, null>;
  unknownArray<F>(F: Applicative<F>): DecoderT<F, unknown, unknown[]>;
  unknownRecord<F>(
    F: Applicative<F>,
  ): DecoderT<F, unknown, Record<string, unknown>>;
  array<F>(
    F: Monad<F>,
  ): <A>(da: DecoderT<F, unknown, A>) => DecoderT<F, unknown, A[]>;
  record<F>(
    F: Monad<F>,
  ): <A>(
    ds: DecoderT<F, unknown, A>,
  ) => DecoderT<F, unknown, Record<string, A>>;
  struct<F>(F: Monad<F>): <A extends {}>(ds: {
    [k in keyof A]: DecoderT<F, unknown, A[k]>;
  }) => DecoderT<F, unknown, A>;
  partial<F>(F: Monad<F>): <A extends {}>(ds: {
    [k in keyof A]: DecoderT<F, unknown, A[k]>;
  }) => DecoderT<F, unknown, Partial<A>>;
  product<F>(
    F: Monad<F>,
  ): <A extends unknown[]>(
    ...ds: { [k in keyof A]: DecoderT<F, unknown, A[k]> }
  ) => DecoderT<F, unknown, A>;
  sum<F>(F: Monad<F>): <T extends string>(
    tag: T,
  ) => <A extends {}>(ds: {
    [k in keyof A]: DecoderT<F, unknown, A[k] & Record<T, k>>;
  }) => DecoderT<F, unknown, A[keyof A]>;
  defer<F, A>(thunk: () => DecoderT<F, unknown, A>): DecoderT<F, unknown, A>;

  // -- Instances

  MonoidK<F, I>(F: Monad<F>): MonoidK<$<DecoderTK, [F, I]>>;
  Functor<F, I>(F: Functor<F>): Functor<$<DecoderTK, [F, I]>>;
  Profunctor<F>(F: Functor<F>): Profunctor<$<DecoderTK, [F]>>;
  Category<F>(F: Monad<F>): Category<$<DecoderTK, [F]>>;
  Monad<F, I>(F: Monad<F>): Monad<$<DecoderTK, [F, I]>>;
  Refining<F>(F: Monad<F>): Refining<$<DecoderTK, [F, unknown]>>;
  Schemable<F>(F: Monad<F>): Schemable<$<DecoderTK, [F, unknown]>>;
  Constraining<F>(F: Monad<F>): Constraining<$<DecoderTK, [F, unknown]>>;
}

DecoderT.succeed = succeed;
DecoderT.succeedT = succeedT;
DecoderT.fail = fail;
DecoderT.failT = failT;
DecoderT.failWith = failWith;
DecoderT.identity = identity;
DecoderT.empty = empty;
DecoderT.tailRecM = tailRecM;
DecoderT.tailRecM_ = tailRecM_;
DecoderT.fromRefinement = fromRefinement;
DecoderT.fromGuard = fromGuard;
DecoderT.literal = literal;
DecoderT.boolean = boolean;
DecoderT.number = number;
DecoderT.string = string;
DecoderT.nullDecoderT = nullDecoderT;
DecoderT.unknownArray = unknownArray;
DecoderT.unknownRecord = unknownRecord;
DecoderT.array = array;
DecoderT.record = record;
DecoderT.struct = struct;
DecoderT.partial = partial;
DecoderT.product = product as DecoderTObj['product'];
DecoderT.sum = sum;
DecoderT.defer = defer;

DecoderT.MonoidK = decoderTMonoidK;
DecoderT.Functor = decoderTFunctor;
DecoderT.Profunctor = decoderTProfunctor;
DecoderT.Category = decoderTCategory;
DecoderT.Monad = decoderTMonad;
DecoderT.Refining = decoderTRefining;
DecoderT.Schemable = decoderTSchemable;
DecoderT.Constraining = decoderTConstraining;

// -- HKT

export interface DecoderTK extends TyK<[unknown, unknown, unknown]> {
  [$type]: DecoderT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
