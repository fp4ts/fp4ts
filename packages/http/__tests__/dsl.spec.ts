import { EitherT, Identity, Option, Right } from '@fp4ts/cats';
import { toHttpRoutes } from '@fp4ts/http-dsl-server/lib/internal/server-derivable';
import {
  Capture,
  Get,
  group,
  Query,
  Route,
} from '@fp4ts/http-dsl-shared/lib/api';
import { Method, Request, uri } from '@fp4ts/http-core';

describe('dsl', () => {
  it('should do something', () => {
    const x = group(
      Route('capture')[':>'](
        group(
          Route('boolean')
            [':>'](Capture.boolean('bool'))
            [':>'](Capture.string('str'))
            [':>'](Get),
          Route('number')[':>'](Capture.number('num'))[':>'](Get),
          Route('string')[':>'](Capture.string('str'))[':>'](Get),
        ),
      ),
      Route('query')[':>'](
        group(
          Route('boolean')[':>'](Query.boolean('bool'))[':>'](Get),
          Route('number')[':>'](Query.number('num'))[':>'](Get),
          Route('string')[':>'](Query.string('str'))[':>'](Get),
        ),
      ),
    );

    const s = toHttpRoutes(Identity.Monad)(
      x,
      [
        [
          (x: boolean) => (y: string) => EitherT.rightUnit(Identity.Monad),
          (x: number) => EitherT.rightUnit(Identity.Monad),
          (x: string) => EitherT.rightUnit(Identity.Monad),
        ],
        [
          (x: Option<boolean>) => EitherT.rightUnit(Identity.Monad),
          (x: Option<number>) => EitherT.rightUnit(Identity.Monad),
          (x: Option<string>) => EitherT.rightUnit(Identity.Monad),
        ],
      ],
      {
        '@fp4ts/http/dsl/boolean': () => Right(true),
        '@fp4ts/http/dsl/number': () => Right(42),
        '@fp4ts/http/dsl/string': () => Right('string'),
      },
    );

    console.log(s.run(new Request(Method.GET, uri`/capture/boolean/42/test`)));
  });
});
