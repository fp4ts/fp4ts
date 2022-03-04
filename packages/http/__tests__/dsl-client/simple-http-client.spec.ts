import fc from 'fast-check';
import { stringType } from '@fp4ts/core';
import { IO } from '@fp4ts/effect-core';
import { Resource } from '@fp4ts/effect-kernel';
import { toClientIOIn } from '@fp4ts/http-dsl-client';
import { toHttpAppIO } from '@fp4ts/http-dsl-server';
import {
  Get,
  GetNoContent,
  group,
  PlainText,
  Post,
  ReqBody,
  Route,
} from '@fp4ts/http-dsl-shared';
import { NodeClient } from '@fp4ts/http-node-client';
import { withServerClient } from '@fp4ts/http-test-kit-node';

const api = group(
  Route('version')[':>'](GetNoContent),
  Route('ping')[':>'](Get(PlainText, stringType)),
  Route('echo')
    [':>'](ReqBody(PlainText, stringType))
    [':>'](Post(PlainText, stringType)),
);

const app = toHttpAppIO(api, {})(S => [S.unit, S.return('pong'), S.return]);

const [version, ping, echo] = toClientIOIn(api, {});

describe('Simple HTTP api dsl client', () => {
  const clientResource = Resource.pure(NodeClient.makeClient(IO.Async));

  it('should respond with a unit response', async () => {
    await withServerClient(
      app,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;
      return version
        .run(client.withBaseUri(baseUri))
        .flatMap(resp => IO(() => expect(resp).toBeUndefined()));
    }).unsafeRunToPromise();
  });

  it("should respond with a 'pong'", async () => {
    await withServerClient(
      app,
      clientResource,
    )((server, client) => {
      const baseUri = server.baseUri;
      return ping
        .run(client.withBaseUri(baseUri))
        .flatMap(resp => IO(() => expect(resp).toBe('pong')));
    }).unsafeRunToPromise();
  });

  it('should respond with sent payload', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), s =>
        withServerClient(
          app,
          clientResource,
        )((server, client) => {
          const baseUri = server.baseUri;
          return echo(s)
            .run(client.withBaseUri(baseUri))
            .flatMap(resp => IO(() => expect(resp).toBe(s)));
        }).unsafeRunToPromise(),
      ),
    );
  });
});
