// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Monad } from '../monad';
import { XPure, XPureF } from './x-pure';

export type Reader<R, A> = XPure<unknown, unknown, unknown, R, never, A>;

export const Reader: ReaderObj = function <A, R = unknown>(a: A): Reader<R, A> {
  return XPure.pure(a);
};

interface ReaderObj {
  <A, R = unknown>(a: A): Reader<R, A>;

  pure<A, R = unknown>(a: A): Reader<R, A>;
  read<R>(): Reader<R, R>;

  // -- Instances

  Monad<R>(): Monad<ReaderF<R>>;
}

Reader.pure = XPure.pure;
Reader.read = XPure.read;

// -- Instances

Reader.Monad = XPure.Monad;

// -- HKT

export type ReaderF<R> = $<XPureF, [unknown, unknown, unknown, R, never]>;
