// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, TyK, TyVar } from '@fp4ts/core';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Either } from '../either';

import { Reader as ReaderBase } from './algebra';
import { pure, read, unit } from './constructors';
import {
  readerApplicative,
  readerApply,
  readerFlatMap,
  readerFunctor,
  readerMonad,
} from './instances';
import { tailRecM } from './operators';

export type Reader<R, A> = ReaderBase<R, A>;

export const Reader: ReaderObj = function <A>(a: A): Reader<unknown, A> {
  return pure(a);
} as any;

interface ReaderObj {
  <A>(a: A): Reader<unknown, A>;
  pure<A>(a: A): Reader<unknown, A>;
  unit: Reader<unknown, void>;
  read<R>(): Reader<R, R>;
  tailRecM<A>(
    a: A,
  ): <R, B>(f: (a: A) => Reader<R, Either<A, B>>) => Reader<R, B>;

  // -- Instances

  Functor: <R>() => Functor<$<ReaderF, [R]>>;
  Apply: <R>() => Apply<$<ReaderF, [R]>>;
  Applicative: <R>() => Applicative<$<ReaderF, [R]>>;
  FlatMap: <R>() => FlatMap<$<ReaderF, [R]>>;
  Monad: <R>() => Monad<$<ReaderF, [R]>>;
}

Reader.pure = pure;
Reader.unit = unit;
Reader.read = read;
Reader.tailRecM = tailRecM;

Reader.Functor = readerFunctor;
Reader.Apply = readerApply;
Reader.Applicative = readerApplicative;
Reader.FlatMap = readerFlatMap;
Reader.Monad = readerMonad;

// HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ReaderF extends TyK<[unknown, unknown]> {
  [$type]: Reader<TyVar<this, 0>, TyVar<this, 1>>;
}
