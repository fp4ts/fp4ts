// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Comonad, MonadDefer, Monoid } from '@fp4ts/cats';
import { MonadWriter } from '../monad-writer';
import { IxRWSF, RWS } from './ix-rws';

export type Writer<W, A> = RWS<unknown, W, unknown, A>;

export const Writer: WriterObj = function <W, A>([w, a]: [W, A]) {
  return RWS.tell(w).map(() => a);
};

interface WriterObj {
  <W, A>(wa: [W, A]): Writer<W, A>;
  pure<A, W = never>(a: A): Writer<W, A>;
  tell<W>(w: W): Writer<W, void>;

  // -- Instances

  Monad<W>(): MonadDefer<WriterF<W>>;
  Comonad<W>(W: Monoid<W>): Comonad<WriterF<W>>;
  MonadWriter<W>(L: Monoid<W>): MonadWriter<WriterF<W>, W>;
}

Writer.pure = RWS.pure;
Writer.tell = RWS.tell;
Writer.Monad = RWS.Monad;

Writer.Comonad = <W>(W: Monoid<W>) => {
  const { andThen, andThen_, compose, compose_, ...WF } = Writer.Monad<W>();
  return Comonad.of<WriterF<W>>({
    ...WF,
    extract: fa => fa.runA(undefined, undefined, W),
    coflatMap_: (fa, f) => fa.map(() => f(fa)),
  });
};

Writer.MonadWriter = RWS.MonadWriter;

// -- HKT

export type WriterF<W> = $<IxRWSF, [unknown, W, unknown, unknown]>;
