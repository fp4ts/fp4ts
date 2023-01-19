// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Some } from '@fp4ts/cats';
import { Encoder } from '@fp4ts/schema';
import { Stream, text } from '@fp4ts/stream';
import { Entity } from '../entity';
import { Headers, ContentType } from '../headers_';
import { MediaType } from '../media-type';

export class EntityEncoder<F, A> {
  public constructor(
    private readonly encoder: Encoder<Entity<F>, A>,
    public readonly headers: Headers,
  ) {}

  public withHeaders(hs: Headers): EntityEncoder<F, A> {
    return new EntityEncoder(this.encoder, hs);
  }

  public toEntity(a: A): Entity<F> {
    return this.encoder.encode(a);
  }

  public contramap<AA>(f: (a: AA) => A): EntityEncoder<F, AA> {
    return new EntityEncoder(this.encoder.contramap(f), this.headers);
  }

  public static text<F>(): EntityEncoder<F, string> {
    return new EntityEncoder(
      Encoder(
        s =>
          new Entity(
            Stream.pure<F, string>(s).through(text.utf8.encode()),
            Some(s.length),
          ),
      ),
      Headers.fromToRaw(new ContentType(MediaType['text/plain'])),
    );
  }

  public static json<F, A>(): EntityEncoder<F, A> {
    return this.text<F>()
      .contramap(x => JSON.stringify(x))
      .withHeaders(
        Headers.fromToRaw(new ContentType(MediaType['application/json'])),
      );
  }
}
