// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Byte } from '@fp4ts/core';
import { Some } from '@fp4ts/cats';
import { Encoder } from '@fp4ts/schema';
import { Chunk, Stream } from '@fp4ts/stream';
import { Entity } from '../entity';
import { Headers } from '../headers_';

export class EntityEncoder<F, A> {
  public static text<F>(): EntityEncoder<F, string> {
    return new EntityEncoder(
      Encoder(
        s =>
          new Entity(
            Stream.emitChunk<F, Byte>(Chunk.fromBuffer(s)),
            Some(s.length),
          ),
      ),
      Headers.empty,
    );
  }

  public constructor(
    private readonly encoder: Encoder<Entity<F>, A>,
    public readonly headers: Headers,
  ) {}

  public toEntity(a: A): Entity<F> {
    return this.encoder.encode(a);
  }

  public contramap<AA>(f: (a: AA) => A): EntityEncoder<F, AA> {
    return new EntityEncoder(this.encoder.contramap(f), this.headers);
  }
}
