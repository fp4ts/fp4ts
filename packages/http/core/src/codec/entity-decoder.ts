// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose, Kind, pipe } from '@fp4ts/core';
import { EitherT, Functor, Monad, Try } from '@fp4ts/cats';
import { Concurrent } from '@fp4ts/effect';
import { DecodeFailure, DecodeResultT, DecoderT } from '@fp4ts/schema';
import { Media } from '../media';
import { MediaRange, MediaType } from '../media-type';

export type DecodeResult<F, A> = DecodeResultT<F, A>;

export class EntityDecoder<F, A> {
  public constructor(
    private readonly decoder: DecoderT<F, Media<F>, A>,
    public readonly consumes: Readonly<Set<MediaRange>>,
  ) {}

  public canConsume(mt: MediaType): boolean {
    return [...this.consumes].some(mr => mr.satisfiedBy(mt));
  }

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

  public andThen<AA, B>(
    this: EntityDecoder<F, AA>,
    F: Monad<F>,
  ): (that: DecoderT<F, AA, B>) => EntityDecoder<F, B> {
    return that =>
      new EntityDecoder(this.decoder.andThen(F)(that), this.consumes);
  }

  public static text<F>(F: Concurrent<F, Error>): EntityDecoder<F, string> {
    return new EntityDecoder(
      DecoderT(compose(EitherT.rightT(F), this.decodeText(F))),
      new Set([MediaType.text_plain]),
    );
  }

  public static json<F>(F: Concurrent<F, Error>): EntityDecoder<F, unknown> {
    return new EntityDecoder(
      DecoderT(media =>
        pipe(
          this.decodeText(F)(media),
          F.map(x =>
            Try(() => JSON.parse(x)).toEither.leftMap(
              e => new DecodeFailure(e.message),
            ),
          ),
          EitherT,
        ),
      ),
      new Set([MediaType.application_json]),
    );
  }

  public static readonly decodeText =
    <F>(F: Concurrent<F, Error>) =>
    (m: Media<F>): Kind<F, [string]> =>
      m.bodyText.compileConcurrent(F).string;
}
