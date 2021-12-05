// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats';

export interface Console<F> {
  readonly readLine: Kind<F, [string]>;
  printLn(a: string): Kind<F, [void]>;
}

export interface Random<F> {
  nextIntBetween(min: number, max: number): Kind<F, [number]>;
}

export type Program<F> = Monad<F> & Console<F> & Random<F>;
