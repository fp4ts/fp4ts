// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Comonad, StackSafeMonad } from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { MonadWriter } from '../monad-writer';
import { IxRWSF, RWS } from './ix-rws';

export type Writer<W, A> = RWS<unknown, W, void, A>;

export const Writer: WriterObj = function <W, A>([w, a]: [W, A]) {
  return RWS.tell<W, void>(w).map(() => a);
};

interface WriterObj {
  <W, A>(wa: [W, A]): Writer<W, A>;
  pure<A, W = never>(a: A): Writer<W, A>;
  tell<W>(w: W): Writer<W, void>;

  // -- Instances

  Monad<W>(): StackSafeMonad<WriterF<W>>;
  Comonad<W>(W: Monoid<W>): Comonad<WriterF<W>>;
  MonadWriter<W>(L: Monoid<W>): MonadWriter<WriterF<W>, W>;
}

Writer.pure = RWS.pure;
Writer.tell = RWS.tell;
Writer.Monad = RWS.Monad;

Writer.Comonad = <W>(W: Monoid<W>) =>
  Comonad.of<WriterF<W>>({
    ...Writer.Monad<W>(),
    extract: fa => fa.runA(undefined, undefined, W),
    coflatMap_: (fa, f) => fa.map(() => f(fa)),
  });

Writer.MonadWriter = RWS.MonadWriter;

// -- HKT

export type WriterF<W> = $<IxRWSF, [unknown, W, void, void]>;
