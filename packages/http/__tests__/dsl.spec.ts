import { EitherT, Identity, IdentityK, Left, Option, Right } from '@fp4ts/cats';
import { toHttpRoutes } from '@fp4ts/http-dsl-server/lib/internal/server-derivable';
import {
  Capture,
  Get,
  group,
  PlainText,
  Query,
  Route,
} from '@fp4ts/http-dsl-shared/lib/api';
import { Method, Request, uri, ParsingFailure } from '@fp4ts/http-core';
import {
  booleanType,
  numberType,
  stringType,
} from '@fp4ts/http-dsl-shared/lib/types';
import { IO, IoK } from '@fp4ts/effect-core';

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
      {
        '@fp4ts/http/dsl/boolean': {
          decode: x => {
            switch (x) {
              case 'true':
                return Right(true);
              case 'false':
                return Right(false);
              default:
                return Left(
                  new ParsingFailure(`Expected boolean, found '${x}'`),
                );
            }
          },
          encode: x => global.JSON.stringify(x),
        },
        '@fp4ts/http/dsl/number': {
          decode: x => {
            const n = parseFloat(x);
            return Number.isNaN(n) || Number.isFinite(n)
              ? Left(new ParsingFailure(`Expected number, found ${x}`))
              : Right(n);
          },
          encode: x => global.JSON.stringify(x),
        },
        '@fp4ts/http/dsl/string': {
          decode: x => Right(x),
          encode: x => x,
        },
      },
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
