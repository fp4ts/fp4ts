import { Kind } from '@fp4ts/core';
import { MonadError, Option } from '@fp4ts/cats';
import { Stream, text } from '@fp4ts/stream';

import { Headers, ContentLength } from './headers';
import { Entity } from './entity';
import { EntityBody } from './entity-body';
import { EntityDecoder, DecodeResult } from './codec';

export abstract class Media<F> {
  public abstract readonly headers: Headers;
  public abstract readonly entity: Entity<F>;
  public get body(): EntityBody<F> {
    return this.entity.body;
  }

  public get bodyText(): Stream<F, string> {
    return this.body.through(text.utf8.decode());
  }

  public get contentLength(): Option<number> {
    return this.headers.get(ContentLength.Select).map(x => x.length);
  }

  public attemptAs<A>(decoder: EntityDecoder<F, A>): DecodeResult<F, A> {
    return decoder.decode(this);
  }

  public as(
    F: MonadError<F, Error>,
  ): <A>(decoder: EntityDecoder<F, A>) => Kind<F, [A]> {
    return decoder => F.rethrow(this.attemptAs(decoder).value);
  }
}
