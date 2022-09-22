// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Left, Right } from '@fp4ts/cats';
import { booleanType, id, numberType, stringType } from '@fp4ts/core';
import { IO } from '@fp4ts/effect';
import { Request, EntityDecoder, uri } from '@fp4ts/http-core';
import { Capture, Get, group, JSON, QueryParam, Route } from '@fp4ts/http-dsl';
import { builtins, toHttpApp } from '@fp4ts/http-dsl-server';

describe('parameter extraction', () => {
  const api = group(
    Route('capture')[':>'](
      group(
        Route('boolean')
          [':>'](Capture('flag', booleanType))
          [':>'](Get(JSON, booleanType)),
        Route('number')
          [':>'](Capture('number', numberType))
          [':>'](Get(JSON, numberType)),
        Route('string')
          [':>'](Capture('string', stringType))
          [':>'](Get(JSON, stringType)),
      ),
    ),
    Route('query')[':>'](
      group(
        Route('boolean')
          [':>'](QueryParam('boolean', booleanType))
          [':>'](Get(JSON, stringType)),
        Route('number')
          [':>'](QueryParam('number', numberType))
          [':>'](Get(JSON, stringType)),
        Route('string')
          [':>'](QueryParam('string', stringType))
          [':>'](Get(JSON, stringType)),
      ),
    ),
  );
  const app = toHttpApp(IO.Concurrent)(api, builtins)(S => [
    [
      flag => S.return(flag),
      number => S.return(number),
      string => S.return(string),
    ],
    [
      boolean => S.return(boolean.fold(() => 'null', global.JSON.stringify)),
      number => S.return(number.fold(() => 'null', global.JSON.stringify)),
      string => S.return(string.fold(() => 'null', id)),
    ],
  ]);

  const jsonDecoder = EntityDecoder.json(IO.Concurrent);

  describe('capture', () => {
    it.each`
      url                   | param
      ${'/capture/boolean'} | ${true}
      ${'/capture/boolean'} | ${false}
      ${'/capture/number'}  | ${42}
      ${'/capture/number'}  | ${-42}
      ${'/capture/string'}  | ${'42'}
      ${'/capture/string'}  | ${'another string with spaces'}
    `(
      'should capture parameter $param from url $url/$param',
      async ({ url, param }) => {
        const response = await app(new Request({ uri: uri`${url}/${param}` }))
          .flatMap(response => jsonDecoder.decode(response))
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
        const response = await app(new Request({ uri: uri`${url}/${param}` }))
          .flatMap(response => jsonDecoder.decode(response))
          .unsafeRunToPromise();

        expect(response).toEqual(Left(expect.any(Error)));
      },
    );
  });

  describe('query', () => {
    it.each`
      url                 | param    | name
      ${'/query/boolean'} | ${true}  | ${'boolean'}
      ${'/query/boolean'} | ${false} | ${'boolean'}
      ${'/query/number'}  | ${42}    | ${'number'}
      ${'/query/number'}  | ${-42}   | ${'number'}
      ${'/query/string'}  | ${'42'}  | ${'string'}
      ${'/query/string'}  | ${''}    | ${'string'}
    `(
      'should capture query $param from url $url?$name=$param',
      async ({ url, param, name }) => {
        const response = await app(
          new Request({ uri: uri`${url}?${name}=${param}` }),
        )
          .flatMap(response => jsonDecoder.decode(response))
          .unsafeRunToPromise();

        expect(response).toEqual(Right(param.toString()));
      },
    );

    it.each`
      url
      ${'/query/boolean'}
      ${'/query/number'}
      ${'/query/string'}
    `(
      'should return none when the param not present in $url',
      async ({ url }) => {
        const response = await app(new Request({ uri: uri`${url}` }))
          .flatMap(response => jsonDecoder.decode(response))
          .unsafeRunToPromise();

        expect(response).toEqual(Right('null'));
      },
    );

    it.each`
      url                   | $name        | param
      ${'/capture/boolean'} | ${'boolean'} | ${42}
      ${'/capture/boolean'} | ${'boolean'} | ${'falsee'}
      ${'/capture/number'}  | ${'number'}  | ${''}
      ${'/capture/number'}  | ${'number'}  | ${'true'}
    `(
      'should fail to capture query parameter $param from url $url?$name=$param',
      async ({ url, param, name }) => {
        const response = await app(
          new Request({ uri: uri`${url}?${name}=${param}` }),
        )
          .flatMap(response => jsonDecoder.decode(response))
          .unsafeRunToPromise();

        expect(response).toEqual(Left(expect.any(Error)));
      },
    );
  });
});
