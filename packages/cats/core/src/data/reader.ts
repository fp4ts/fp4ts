// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Monad } from '../monad';
import {
  IndexedReaderWriterState,
  IndexedReaderWriterStateF,
} from './indexed-reader-writer-state';

export type Reader<R, A> = IndexedReaderWriterState<
  unknown,
  unknown,
  unknown,
  R,
  never,
  A
>;

export const Reader: ReaderObj = function <A, R = unknown>(a: A): Reader<R, A> {
  return IndexedReaderWriterState.pure(a);
};

interface ReaderObj {
  <A, R = unknown>(a: A): Reader<R, A>;

  pure<A, R = unknown>(a: A): Reader<R, A>;
  ask<R>(): Reader<R, R>;
  lift<R, A>(f: (r: R) => A): Reader<R, A>;

  // -- Instances

  Monad<R>(): Monad<ReaderF<R>>;
}

Reader.pure = IndexedReaderWriterState.pure;
Reader.ask = IndexedReaderWriterState.ask;
Reader.lift = <R, A>(f: (r: R) => A): Reader<R, A> => Reader.ask<R>().map(f);

// -- Instances

Reader.Monad = IndexedReaderWriterState.Monad;

// -- HKT

export type ReaderF<R> = $<
  IndexedReaderWriterStateF,
  [unknown, unknown, unknown, R, never]
>;
