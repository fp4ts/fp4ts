// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Left, Right } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect';
import {
  Request,
  HttpRoutes,
  EntityEncoder,
  EntityDecoder,
  uri,
} from '@fp4ts/http-core';
import { Capture, GET, Ok, Query, Routes } from '@fp4ts/http-dsl';

describe('parameter extraction', () => {
  const app = HttpRoutes.orNotFound(IO.Monad)(
    Routes.of(IO.Monad)($ =>
      $.group(
        $(GET, 'capture', 'boolean', Capture.boolean('flag'), ({ flag }) =>
          Ok(flag)(EntityEncoder.json()),
        ),
        $(GET, 'capture', 'number', Capture.number('number'), ({ number }) =>
          Ok(number)(EntityEncoder.json()),
        ),
        $(GET, 'capture', 'string', Capture.string('string'), ({ string }) =>
          Ok(string)(EntityEncoder.json()),
        ),

        $(GET, 'query', 'boolean', Query.boolean('boolean'), ({ boolean }) =>
          Ok(boolean.fold(() => null, id))(EntityEncoder.json()),
        ),
        $(GET, 'query', 'number', Query.number('number'), ({ number }) =>
          Ok(number.fold(() => null, id))(EntityEncoder.json()),
        ),
        $(GET, 'query', 'string', Query.string('string'), ({ string }) =>
          Ok(string.fold(() => null, id))(EntityEncoder.json()),
        ),
      ),
    ),
  );

  const jsonDecoder = EntityDecoder.json(IO.Concurrent);

  describe('capture', () => {
    it.each`
      url                   | param
      ${'/capture/boolean'} | ${true}
      ${'/capture/boolean'} | ${false}
      ${'/capture/number'}  | ${42}
      ${'/capture/number'}  | ${-42}
      ${'/capture/string'}  | ${'42'}
      ${'/capture/string'}  | ${''}
    `(
      'should capture parameter $param from url $url/$param',
      async ({ url, param }) => {
        const response = await app
          .run(new Request(GET, uri`${url}/${param}`))
          .flatMap(response => jsonDecoder.decode(response).value)
          .unsafeRunToPromise();

        expect(response).toEqual(Right(param));
      },
    );

    it.each`
      url                   | param
      ${'/capture/boolean'} | ${42}
      ${'/capture/boolean'} | ${'falsee'}
      ${'/capture/number'}  | ${''}
      ${'/capture/number'}  | ${'true'}
    `(
      'should fail to capture parameter $param from url $url/$param',
      async ({ url, param }) => {
        const response = await app
          .run(new Request(GET, uri`${url}/${param}`))
          .flatMap(response => jsonDecoder.decode(response).value)
          .unsafeRunToPromise();

        expect(response).toEqual(Left(expect.any(Error)));
      },
    );
  });

  describe('query', () => {
    it.each`
      url         | param    | name
      ${'/query'} | ${true}  | ${'boolean'}
      ${'/query'} | ${false} | ${'boolean'}
      ${'/query'} | ${42}    | ${'number'}
      ${'/query'} | ${-42}   | ${'number'}
      ${'/query'} | ${'42'}  | ${'string'}
      ${'/query'} | ${''}    | ${'string'}
    `(
      'should capture query $param from url $url/${name}?$name=$param',
      async ({ url, param, name }) => {
        const response = await app
          .run(new Request(GET, uri`${url}/${name}?${name}=${param}`))
          .flatMap(response => jsonDecoder.decode(response).value)
          .unsafeRunToPromise();

        expect(response).toEqual(Right(param));
      },
    );

    it.each`
      url         | name
      ${'/query'} | ${'boolean'}
      ${'/query'} | ${'boolean'}
      ${'/query'} | ${'number'}
      ${'/query'} | ${'number'}
      ${'/query'} | ${'string'}
      ${'/query'} | ${'string'}
    `(
      'should return none when the param value is not present in $url/${name}?${name}',
      async ({ url, name }) => {
        const response = await app
          .run(new Request(GET, uri`${url}/${name}?${name}`))
          .flatMap(response => jsonDecoder.decode(response).value)
          .unsafeRunToPromise();

        expect(response).toEqual(Right(null));
      },
    );

    it.each`
      url                   | $name        | param
      ${'/capture/boolean'} | ${'boolean'} | ${42}
      ${'/capture/boolean'} | ${'boolean'} | ${'falsee'}
      ${'/capture/number'}  | ${'number'}  | ${''}
      ${'/capture/number'}  | ${'number'}  | ${'true'}
    `(
      'should fail to capture query parameter $param from url $url/$name?$name=$param',
      async ({ url, param, name }) => {
        const response = await app
          .run(new Request(GET, uri`${url}/${name}?${name}=${param}`))
          .flatMap(response => jsonDecoder.decode(response).value)
          .unsafeRunToPromise();

        expect(response).toEqual(Left(expect.any(Error)));
      },
    );
  });
});
