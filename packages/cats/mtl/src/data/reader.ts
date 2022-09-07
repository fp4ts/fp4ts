// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats-core';
import { IxRWSF, RWS } from './ix-rws';
import { MonadReader } from '../monad-reader';

export type Reader<R, A> = RWS<R, never, void, A>;

export const Reader: ReaderObj = function <A, R = unknown>(a: A): Reader<R, A> {
  return Reader.pure(a);
};

interface ReaderObj {
  <A, R = unknown>(a: A): Reader<R, A>;

  pure<A, R = unknown>(a: A): Reader<R, A>;
  ask<R>(): Reader<R, R>;
  lift<R, A>(f: (r: R) => A): Reader<R, A>;

  // -- Instances

  Monad<R>(): Monad<ReaderF<R>>;
  MonadReader<R>(): MonadReader<ReaderF<R>, R>;
}

Reader.pure = RWS.pure;
Reader.ask = RWS.ask;
Reader.lift = <R, A>(f: (r: R) => A): Reader<R, A> => Reader.ask<R>().map(f);

// -- Instances

Reader.Monad = RWS.Monad;
Reader.MonadReader = RWS.MonadReader;

// -- HKT

export type ReaderF<R> = $<IxRWSF, [R, never, void, void]>;
