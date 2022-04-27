// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, lazyVal } from '@fp4ts/core';
import { Comonad } from '../comonad';
import { Monad } from '../monad';
import { XPure, XPureF } from './x-pure';

export type Writer<L, V> = XPure<L, unknown, unknown, unknown, never, V>;

export const Writer: WriterObj = function ([l, v]) {
  return XPure.tell(l).map(() => v);
};

interface WriterObj {
  <L, V>(lv: [L, V]): Writer<L, V>;
  pure<V, L = never>(v: V): Writer<L, V>;
  tell<L>(l: L): Writer<L, void>;

  // -- Instances

  Monad<L>(): Monad<WriterF<L>>;
  Comonad<L>(): Comonad<WriterF<L>>;
}

Writer.pure = XPure.pure;
Writer.tell = XPure.tell;
Writer.Monad = XPure.Monad;

Writer.Comonad = lazyVal(<L>() =>
  Comonad.of<WriterF<L>>({
    ...Writer.Monad<L>(),
    extract: fa => fa.runWriter()[1],
    coflatMap_: (fa, f) => fa.map(() => f(fa)),
  }),
) as <L>() => Comonad<WriterF<L>>;

// -- HKT

export type WriterF<L> = $<XPureF, [L, unknown, unknown, unknown, never]>;
