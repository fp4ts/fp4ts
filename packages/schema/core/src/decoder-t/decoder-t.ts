// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $, $type, EvalF, Kind, TyK, TyVar } from '@fp4ts/core';
import {
  Applicative,
  Either,
  EitherT,
  Functor,
  Monad,
  MonoidK,
} from '@fp4ts/cats';
import {
  Constraining,
  Refining,
  Schemable,
  Literal,
} from '@fp4ts/schema-kernel';

import { Guard } from '../guard';
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
import { Profunctor } from '@fp4ts/cats-profunctor';
import { Category } from '@fp4ts/cats-arrow';

export type DecoderT<F, I, A> = DecoderTBase<F, I, A>;
export type Decoder<I, A> = DecoderTBase<EvalF, I, A>;

export const DecoderT: DecoderTObj = function (f) {
  return new DecoderTBase(f);
};

export const Decoder: DecoderObj = function (f) {
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
  ): <A = never, I = unknown>(cause: string) => DecoderT<F, I, A>;
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
  null<F>(F: Applicative<F>): DecoderT<F, unknown, null>;
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

  MonoidK<F, I>(F: Monad<F>): MonoidK<$<DecoderTF, [F, I]>>;
  Functor<F, I>(F: Functor<F>): Functor<$<DecoderTF, [F, I]>>;
  Profunctor<F>(F: Functor<F>): Profunctor<$<DecoderTF, [F]>>;
  Category<F>(F: Monad<F>): Category<$<DecoderTF, [F]>>;
  Monad<F, I>(F: Monad<F>): Monad<$<DecoderTF, [F, I]>>;
  Refining<F>(F: Monad<F>): Refining<$<DecoderTF, [F, unknown]>>;
  Schemable<F>(F: Monad<F>): Schemable<$<DecoderTF, [F, unknown]>>;
  Constraining<F>(F: Monad<F>): Constraining<$<DecoderTF, [F, unknown]>>;
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
DecoderT.null = nullDecoderT;
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

interface DecoderObj {
  <I, A>(f: (i: I) => EitherT<EvalF, DecodeFailure, A>): Decoder<I, A>;
  succeed<A, I = unknown>(x: A): Decoder<I, A>;
  fail<A = never, I = unknown>(e: DecodeFailure): Decoder<I, A>;
  failWith<A = never, I = unknown>(cause: string): Decoder<I, A>;

  identity<A>(): DecoderT<EvalF, A, A>;

  empty<A = never>(): Decoder<unknown, A>;

  tailRecM<S>(
    s0: S,
  ): <I, A>(f: (s: S) => Decoder<I, Either<S, A>>) => Decoder<I, A>;
  tailRecM_<S, I, A>(
    s0: S,
    f: (s: S) => Decoder<I, Either<S, A>>,
  ): Decoder<I, A>;

  // -- Schema specific
  fromRefinement<I, A extends I>(
    r: (i: I) => i is A,
    expected?: string,
  ): Decoder<I, A>;
  fromGuard<I, A extends I>(g: Guard<I, A>, expected?: string): Decoder<I, A>;
  literal<A extends [Literal, ...Literal[]]>(
    ...xs: A
  ): Decoder<unknown, A[number]>;
  boolean: Decoder<unknown, boolean>;
  number: Decoder<unknown, number>;
  string: Decoder<unknown, string>;
  null: Decoder<unknown, null>;
  unknownArray: Decoder<unknown, unknown[]>;
  unknownRecord: Decoder<unknown, Record<string, unknown>>;
  array<A>(da: Decoder<unknown, A>): Decoder<unknown, A[]>;
  record<A>(ds: Decoder<unknown, A>): Decoder<unknown, Record<string, A>>;
  struct<A extends {}>(ds: {
    [k in keyof A]: Decoder<unknown, A[k]>;
  }): Decoder<unknown, A>;
  partial<A extends {}>(ds: {
    [k in keyof A]: Decoder<unknown, A[k]>;
  }): Decoder<unknown, Partial<A>>;
  product<A extends unknown[]>(
    ...ds: { [k in keyof A]: Decoder<unknown, A[k]> }
  ): Decoder<unknown, A>;
  sum<T extends string>(
    tag: T,
  ): <A extends {}>(ds: {
    [k in keyof A]: Decoder<unknown, A[k] & Record<T, k>>;
  }) => Decoder<unknown, A[keyof A]>;
  defer<I, A>(thunk: () => Decoder<I, A>): Decoder<I, A>;

  // -- Instances

  MonoidK<I>(): MonoidK<$<DecoderF, [I]>>;
  Functor<I>(): Functor<$<DecoderF, [I]>>;
  Profunctor: Profunctor<DecoderF>;
  Category: Category<DecoderF>;
  Monad<I>(): Monad<$<DecoderF, [I]>>;
  Refining: Refining<$<DecoderF, [unknown]>>;
  Schemable: Schemable<$<DecoderF, [unknown]>>;
  Constraining: Constraining<$<DecoderF, [unknown]>>;
}

Decoder.succeed = succeed(Monad.Eval);
Decoder.fail = fail(Monad.Eval);
Decoder.failWith = failWith(Monad.Eval);
Decoder.identity = identity(Monad.Eval);
Decoder.empty = empty(Monad.Eval);
Decoder.tailRecM = tailRecM(Monad.Eval);
Decoder.tailRecM_ = tailRecM_(Monad.Eval);
Decoder.fromRefinement = fromRefinement(Monad.Eval);
Decoder.fromGuard = fromGuard(Monad.Eval);
Decoder.literal = literal(Monad.Eval);
Decoder.boolean = boolean(Monad.Eval);
Decoder.number = number(Monad.Eval);
Decoder.string = string(Monad.Eval);
Decoder.null = nullDecoderT(Monad.Eval);
Decoder.unknownArray = unknownArray(Monad.Eval);
Decoder.unknownRecord = unknownRecord(Monad.Eval);
Decoder.array = array(Monad.Eval);
Decoder.record = record(Monad.Eval);
Decoder.struct = struct(Monad.Eval);
Decoder.partial = partial(Monad.Eval);
Decoder.product = product(Monad.Eval) as DecoderObj['product'];
Decoder.sum = sum(Monad.Eval);
Decoder.defer = defer;

Decoder.MonoidK = <I>() => decoderTMonoidK<EvalF, I>(Monad.Eval) as any;
Decoder.Functor = <I>() => decoderTFunctor<EvalF, I>(Monad.Eval) as any;
Decoder.Profunctor = decoderTProfunctor(Monad.Eval) as any;
Decoder.Category = decoderTCategory(Monad.Eval) as any;
Decoder.Monad = <I>() => decoderTMonad<EvalF, I>(Monad.Eval) as any;
Decoder.Refining = decoderTRefining(Monad.Eval) as any;
Decoder.Schemable = decoderTSchemable(Monad.Eval) as any;
Decoder.Constraining = decoderTConstraining(Monad.Eval) as any;

// -- HKT

export interface DecoderTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: DecoderT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}

export interface DecoderF extends TyK<[unknown, unknown]> {
  [$type]: Decoder<TyVar<this, 0>, TyVar<this, 1>>;
}
