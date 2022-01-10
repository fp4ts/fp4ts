import { EitherT, Identity, IdentityK } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect-core';
import { Method, Request, uri } from '@fp4ts/http-core';
import { toHttpRoutes } from '@fp4ts/http-dsl-server';
import {
  Capture,
  Get,
  group,
  PlainText,
  Query,
  Route,
  booleanType,
  numberType,
  stringType,
} from '@fp4ts/http-dsl-shared';

describe('dsl', () => {
  it('should do something', async () => {
    const x = group(
      Route('capture')[':>'](
        group(
          Route('boolean')
            [':>'](Capture.boolean('bool'))
            [':>'](Get(PlainText, booleanType)),
          Route('number')
            [':>'](Capture.number('num'))
            [':>'](Get(PlainText, numberType)),
          Route('string')
            [':>'](Capture.string('str'))
            [':>'](Get(PlainText, stringType)),
        ),
      ),
      Route('query')[':>'](
        group(
          Route('boolean')
            [':>'](Query.boolean('bool'))
            [':>'](Get(PlainText, stringType)),
          Route('number')
            [':>'](Query.number('num'))
            [':>'](Get(PlainText, stringType)),
          Route('string')
            [':>'](Query.string('str'))
            [':>'](Get(PlainText, stringType)),
        ),
      ),
    );

    const s = toHttpRoutes(Identity.Monad)(
      x,
      [
        [
          x => EitherT.right(Identity.Monad)(x),
          x => EitherT.right(Identity.Monad)(x),
          x => EitherT.right(Identity.Monad)(x),
        ],
        [
          x =>
            EitherT.right(Identity.Monad)(
              x.map(JSON.stringify).getOrElse(() => 'empty'),
            ),
          x =>
            EitherT.right(Identity.Monad)(
              x.map(JSON.stringify).getOrElse(() => 'empty'),
            ),
          x =>
            EitherT.right(Identity.Monad)(
              x.map(JSON.stringify).getOrElse(() => 'empty'),
            ),
        ],
      ],
      {},
    );

    console.log(
      await s
        .run(new Request<IdentityK>(Method.GET, uri`/capture/boolean/true`))
        .value.get.mapK<IoK>(IO.pure)
        .bodyText.compileConcurrent()
        .string.unsafeRunToPromise(),
    );
  });
});
