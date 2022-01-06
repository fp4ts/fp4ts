import http from 'http';
import { Kind, pipe, snd } from '@fp4ts/core';
import { Either, List } from '@fp4ts/cats';
import { Async, Resource, Dispatcher } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream';
import * as io from '@fp4ts/stream-io';
import {
  Headers,
  HttpApp,
  Method,
  Uri,
  RawHeader,
  Request,
  Entity,
} from '@fp4ts/http-core';

export class NodeServer<F> {
  public listen(port: number = 3000): Kind<F, [void]> {
    return this.F.async_(cb =>
      this.server.listen(port, () => cb(Either.rightUnit)),
    );
  }

  public close(): Kind<F, [void]> {
    return this.F.async_(cb => this.server.close(() => cb(Either.rightUnit)));
  }

  private constructor(
    private readonly F: Async<F>,
    public readonly server: http.Server,
  ) {}

  public static make =
    <F>(F: Async<F>) =>
    (app: HttpApp<F>): Resource<F, NodeServer<F>> => {
      const handleConnection = serveApp(F)(app);
      const RF = Resource.Async(F);
      return pipe(
        RF.Do,
        RF.bindTo('dispatcher', Dispatcher(F)),
        RF.bindTo('server', ({ dispatcher }) =>
          Resource.makeFull(F)(
            poll =>
              F.delay(() =>
                http.createServer((req, res) =>
                  dispatcher.unsafeRunAndForget(
                    poll(handleConnection(req, res)),
                  ),
                ),
              ),
            (s, _) => F.async_(cb => s.close(() => cb(Either.rightUnit))),
          ),
        ),
        RF.map(({ server }) => new NodeServer(F, server)),
      );
    };
}

const serveApp =
  <F>(F: Async<F>) =>
  (app: HttpApp<F>) =>
  (req: http.IncomingMessage, res: http.ServerResponse): Kind<F, [void]> =>
    pipe(
      F.Do,
      F.bindTo('method', F.fromEither(Method.fromString(req.method ?? ''))),
      F.bindTo(
        'uri',
        F.fromEither(Uri.fromString(`http://localhost:3000/${req.url ?? ''}`)),
      ),
      F.bindTo('headers', F.pure(incomingHeadersToHeaders(req.headers))),
      F.bindTo(
        'body',
        F.pure(
          Stream.resource(F)(io.suspendReadableAndRead(F)()(() => req)).flatMap(
            snd,
          ),
        ),
      ),
      F.bindTo('request', ({ method, uri, headers, body }) =>
        F.pure(new Request(method, uri, '1.1', headers, new Entity(body))),
      ),
      F.bindTo('response', ({ request }) => app.run(request)),
      F.bind(({ response }) =>
        F.delay(() => {
          const headers = headersToOutgoingHeaders(response.headers);
          res.writeHead(response.status.code, response.status.name, headers);
        }),
      ),
      F.bind(
        ({ response }) =>
          response.body
            .through(io.writeWritable(F)(F.pure(res)))
            .compileConcurrent(F).drain,
      ),
    );

const incomingHeadersToHeaders = (hs: http.IncomingHttpHeaders): Headers => {
  const rawHeaders: RawHeader[] = [];
  for (const [k, val] of Object.entries(hs)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      rawHeaders.push(...val.map(v => new RawHeader(k, v)));
    } else {
      rawHeaders.push(new RawHeader(k, val));
    }
  }
  return new Headers(List.fromArray(rawHeaders));
};

const headersToOutgoingHeaders = (hs: Headers): http.OutgoingHttpHeaders => {
  const outgoingHeaders: http.OutgoingHttpHeaders = {};
  for (const { headerName, headerValue } of hs.headers.toArray) {
    if (Array.isArray(outgoingHeaders[headerName])) {
      (outgoingHeaders[headerName] as any).push(headerValue);
    }
    if (typeof outgoingHeaders[headerName] === 'string') {
      outgoingHeaders[headerName] = [
        outgoingHeaders[headerName] as any,
        headerValue,
      ];
    }
    outgoingHeaders[headerName] = headerValue;
  }
  return outgoingHeaders;
};
