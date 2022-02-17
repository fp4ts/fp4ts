// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, EitherT, Eval } from '@fp4ts/cats';
import { Kind } from '@fp4ts/core';
import { DecodeFailure } from '../decode-failure';

export class DecoderT<F, I, A> {
  private readonly __void!: void;

  public constructor(
    public readonly decode: (i: I) => EitherT<F, DecodeFailure, A>,
  ) {}
}
