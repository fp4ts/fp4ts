// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Encoder } from '../encoder';
import { Decoder } from '../decoder-t';
import { DecodeResult } from '../decoder-t';

export class Codec<I, O, A> {
  public constructor(
    public readonly toEncoder: Encoder<O, A>,
    public readonly toDecoder: Decoder<I, A>,
  ) {}

  public readonly encode: (a: A) => O = this.toEncoder.encode;
  public readonly decode: (i: I) => DecodeResult<A> = this.toDecoder.decode;
}
