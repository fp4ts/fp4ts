// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { MonadError, Option } from '@fp4ts/cats';
import { Stream, text } from '@fp4ts/stream';

import { Headers, ContentLength, ContentType } from './headers_';
import { EntityBody } from './entity-body';
import { EntityDecoder, DecodeResult } from './codec';

export abstract class Media<F> {
  public abstract readonly headers: Headers;
  public abstract readonly body: EntityBody<F>;

  public get bodyText(): Stream<F, string> {
    return this.body.through(text.utf8.decode());
  }

  public get contentType(): Option<ContentType> {
    return this.headers.get(ContentType.Select);
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
    return decoder => F.rethrow(this.attemptAs(decoder));
  }
}
