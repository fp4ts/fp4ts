// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { Byte } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { headOption, to } from '@fp4ts/optics';
import { Logger, LogLevel, LogMessage } from '@fp4ts/logging';
import { Chunk, Stream } from '@fp4ts/stream';
import {
  EntityEncoder,
  Get_,
  HttpApp,
  Method,
  path,
  Post_,
  RawHeader,
  Request,
  Status,
  uri,
} from '@fp4ts/http-core';
import { HttpLogger, RequestLogger, ResponseLogger } from '@fp4ts/http-server';

describe('Logger', () => {
  const testApp = HttpApp<IOF>(req =>
    Post_<IOF>(path`/post`)
      .compose(
        to(() =>
          IO.pure(
            Status.Ok<IOF>()
              .withBodyStream(req.body)
              .putHeaders(new RawHeader('X-Response-H', 'response')),
          ),
        ),
      )
      .orElse(
        Get_<IOF>(path`/request`).compose(
          to(() =>
            IO.pure(Status.Ok('request response')(EntityEncoder.text<IOF>())),
          ),
        ),
      )
      .apply(headOption)(req)
      .getOrElse(() => IO.pure(Status.NotFound())),
  );

  const body = Stream.emitChunk<IOF, Byte>(
    Chunk.fromBuffer('This is a test resource.'),
  );
  const expectedBody = 'This is a test resource.';

  describe('RequestLogger', () => {
    const logger = RequestLogger(IO.Async)<IOF, IOF>(
      Logger.empty(IO.Applicative)(),
      FunctionK.id<IOF>(),
    );

    it.M('should not affect on Get request', () =>
      logger(testApp)(new Request<IOF>({ uri: uri`/request` })).map(res =>
        expect(res.status.code).toBe(Status.Ok.code),
      ),
    );

    it.M('should not affect on Post request', () =>
      logger(testApp)(
        new Request<IOF>({ method: Method.POST, uri: uri`/post`, body }),
      )
        .flatMap(res => res.bodyText.compileConcurrent().string)
        .map(body => expect(body).toBe(expectedBody)),
    );

    it.M('should use default log formatter', () => {
      const msgs: LogMessage<string>[] = [];
      const logger = RequestLogger(IO.Async)<IOF, IOF>(
        new Logger(IO.Applicative, msg => IO.delay(() => msgs.push(msg)).void),
        FunctionK.id<IOF>(),
      );

      return logger(testApp)(
        new Request<IOF>({ method: Method.POST, uri: uri`/post` })
          .withBodyStream(body)
          .putHeaders(new RawHeader('X-Request-H', 'request')),
      ).map(() =>
        expect(msgs).toEqual([
          new LogMessage(
            LogLevel.Info,
            'HTTP/1.1 POST /post [Headers X-Request-H: request]',
          ),
        ]),
      );
    });
  });

  describe('ResponseLogger', () => {
    const logger = ResponseLogger(IO.Async)<IOF, IOF>(
      Logger.empty(IO.Applicative)(),
      FunctionK.id<IOF>(),
    );

    it.M('should not affect on Get request', () =>
      logger(testApp)(new Request<IOF>({ uri: uri`/request` })).map(res =>
        expect(res.status.code).toBe(Status.Ok.code),
      ),
    );

    it.M('should not affect on Post request', () =>
      logger(testApp)(
        new Request<IOF>({ method: Method.POST, uri: uri`/post`, body }),
      )
        .flatMap(res => res.bodyText.compileConcurrent().string)
        .map(body => expect(body).toBe(expectedBody)),
    );

    it.M('should use default log formatter', () => {
      const msgs: LogMessage<string>[] = [];
      const logger = ResponseLogger(IO.Async)<IOF, IOF>(
        new Logger(IO.Applicative, msg => IO.delay(() => msgs.push(msg)).void),
        FunctionK.id<IOF>(),
      );

      return logger(testApp)(
        new Request<IOF>({ method: Method.POST, uri: uri`/post` })
          .withBodyStream(body)
          .putHeaders(new RawHeader('X-Request-H', 'request')),
      ).map(() =>
        expect(msgs).toEqual([
          new LogMessage(
            LogLevel.Info,
            'HTTP/1.1 200 [Headers X-Response-H: response]',
          ),
        ]),
      );
    });
  });

  describe('HttpLogger', () => {
    const logger = HttpLogger(IO.Async)<IOF, IOF>(
      Logger.empty(IO.Applicative)(),
      FunctionK.id<IOF>(),
    );

    it.M('should not affect on Get request', () =>
      logger(testApp)(new Request<IOF>({ uri: uri`/request` })).map(res =>
        expect(res.status.code).toBe(Status.Ok.code),
      ),
    );

    it.M('should not affect on Post request', () =>
      logger(testApp)(
        new Request<IOF>({ method: Method.POST, uri: uri`/post`, body }),
      )
        .flatMap(res => res.bodyText.compileConcurrent().string)
        .map(body => expect(body).toBe(expectedBody)),
    );
  });

  it.M('should use default log formatter', () => {
    const msgs: LogMessage<string>[] = [];
    const logger = HttpLogger(IO.Async)<IOF, IOF>(
      new Logger(IO.Applicative, msg => IO.delay(() => msgs.push(msg)).void),
      FunctionK.id<IOF>(),
    );

    return logger(testApp)(
      new Request<IOF>({ method: Method.POST, uri: uri`/post` })
        .withBodyStream(body)
        .putHeaders(new RawHeader('X-Request-H', 'request')),
    ).map(() =>
      expect(msgs).toEqual([
        new LogMessage(
          LogLevel.Info,
          'HTTP/1.1 POST /post [Headers X-Request-H: request]',
        ),
        new LogMessage(
          LogLevel.Info,
          'HTTP/1.1 200 [Headers X-Response-H: response]',
        ),
      ]),
    );
  });
});
