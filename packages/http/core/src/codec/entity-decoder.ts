// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Functor, Monad } from '@fp4ts/cats';
import { DecodeFailure, DecodeResultT, DecoderT } from '@fp4ts/schema';
import { Media } from '../media';

type MediaRange = never;

export type DecodeResult<F, A> = DecodeResultT<F, A>;

export class EntityDecoder<F, A> {
  public constructor(
    private readonly decoder: DecoderT<F, Media<F>, A>,
    public readonly consumes: Readonly<Set<MediaRange>>,
  ) {}

  public decode(m: Media<F>): DecodeResult<F, A> {
    return this.decoder.decode(m);
  }

  public map(F: Functor<F>): <B>(f: (a: A) => B) => EntityDecoder<F, B> {
    return f => new EntityDecoder(this.decoder.map(F)(f), this.consumes);
  }

  public flatMapR(
    F: Monad<F>,
  ): <B>(f: (a: A) => DecodeResult<F, B>) => EntityDecoder<F, B> {
    return f => new EntityDecoder(this.decoder.flatMapR(F)(f), this.consumes);
  }

  public handleError<AA>(
    this: EntityDecoder<F, AA>,
    F: Functor<F>,
  ): (f: (f: DecodeFailure) => AA) => EntityDecoder<F, AA> {
    return f =>
      new EntityDecoder(this.decoder.handleError(F)(f), this.consumes);
  }

  public handleErrorWith<AA>(
    this: EntityDecoder<F, AA>,
    F: Monad<F>,
  ): (f: (f: DecodeFailure) => DecodeResult<F, AA>) => EntityDecoder<F, AA> {
    return f =>
      new EntityDecoder(this.decoder.handleErrorWithR(F)(f), this.consumes);
  }
}
