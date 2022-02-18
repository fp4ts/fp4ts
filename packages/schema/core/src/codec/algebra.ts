// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Encoder } from '../encoder';
import { Decoder } from '../decoder-t';
import { DecodeResult } from '../decoder-t';

export abstract class Codec<I, O, A> {
  private readonly __void!: void;

  public abstract encode(a: A): O;
  public abstract decode(i: I): DecodeResult<A>;
}

export class Codec0<I, O, A> extends Codec<I, O, A> {
  public constructor(
    public readonly encoder: Encoder<O, A>,
    public readonly decoder: Decoder<I, A>,
  ) {
    super();
  }

  public readonly encode: (a: A) => O = this.encoder.encode;
  public readonly decode: (i: I) => DecodeResult<A> = this.decoder.decode;
}
