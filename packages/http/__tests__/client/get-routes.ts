// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Map } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { Chunk, Stream, text } from '@fp4ts/stream';
import { EntityEncoder, Response, Status } from '@fp4ts/http-core';

export const SimplePath = '/simple';
export const ChunkedPath = '/chunked';
export const DelayedPath = '/delayed';
export const NoContentPath = '/no-content';
export const NotFoundPath = '/not-found';
export const EmptyNotFoundPath = '/empty-not-found';
export const InternalServerErrorPath = '/internal-server-error';

export const GetRoutes = Map<string, IO<Response<IOF>>>(
  [SimplePath, IO.pure(Status.Ok('simple path')(EntityEncoder.text()))],
  [
    ChunkedPath,
    IO.pure(
      Status.Ok<IOF>().withBodyStream(
        Stream.emitChunk<IOF, string>(
          Chunk.fromArray('chunk'.split('')),
        ).through(text.utf8.encode()),
      ),
    ),
  ],
  [
    DelayedPath,
    IO.sleep(1_000)['>>>'](
      IO.pure(Status.Ok('delayed path')(EntityEncoder.text())),
    ),
  ],
  [NoContentPath, IO.pure(Status.NoContent())],
  [NotFoundPath, IO.pure(Status.NotFound('Not Found')(EntityEncoder.text()))],
  [EmptyNotFoundPath, IO.pure(Status.NotFound())],
  [InternalServerErrorPath, IO.pure(Status.InternalServerError())],
);
