// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from '@fp4ts/schema';
import {
  Capture,
  DeleteNoContent,
  Get,
  group,
  Header,
  Headers,
  Post,
  Put,
  PutNoContent,
  Query,
  RequestBody,
  Route,
  WithStatus,
  JSON,
  PlainText,
  ApiElement,
  PathElement,
  CaptureElement,
  RequestBodyElement,
  EndpointContentElement,
  ApiList,
  ApiGroup,
} from '@fp4ts/http-dsl';
import { Kind } from '@fp4ts/core';
import { IdentityK } from '@fp4ts/cats';

describe('dsl', () => {
  it('should run', () => {
    const User = Schema.struct({
      id: Schema.number,
      first_name: Schema.string,
      last_name: Schema.string,
    });

    const pagination = Query.number('limit')[':>'](Query.number('offset'));

    const crudApi = <T extends string, S>(T: T, S: Schema<S>) =>
      Route(`${T}s`)[':>'](
        group(
          pagination[':>'](Get([JSON], Schema.array(S))),
          RequestBody(S, JSON)[':>'](Post([JSON], WithStatus(S, 201))),
          Capture.number(`${T}_id`)[':>'](
            group(
              RequestBody(S, JSON)[':>'](Put([JSON], S)),
              Get([JSON], S),
              DeleteNoContent(),
            ),
          ),
        ),
      );

    const users = crudApi('user', User);

    const Movie = Schema.struct({
      id: Schema.number,
      title: Schema.string,
    });

    const Streaming = Schema.struct({
      id: Schema.number,
      user_id: Schema.string,
      movie_id: Schema.number,
    });

    const movies = Route('movies')
      [':>'](Header('Authorization', Schema.string))
      [':>'](
        group(
          pagination[':>']('my_list')[':>'](Get([JSON], Schema.array(Movie))),
          Route('stream')
            [':>'](Query.number('movie_id'))
            [':>'](
              Post(
                [JSON],
                Header('X-Streaming-Token', Schema.string),
                Streaming,
              ),
            ),
          Route('stream')
            [':>'](Capture.number('streaming_id'))
            [':>'](
              group(
                Route('pause')[':>'](
                  PutNoContent(Header('X-Test', Schema.string)),
                ),
                Route('resume')[':>'](
                  PutNoContent(
                    Headers(
                      Header('X-Test-1', Schema.string),
                      Header('X-Test-2', Schema.number),
                    ),
                  ),
                ),
              ),
            ),
        ),
      );

    const version = Route('version')[':>'](Get([PlainText], Schema.string));

    const api = group(users, movies, version);

    console.log(global.JSON.stringify(api, null, 2));
  });

  const version = Route('version')[':>'](Get([PlainText], Schema.string));
  type VersionApi = typeof version;
  type VersionHandler = DeriveHandler<IdentityK, VersionApi>;

  const User = Schema.struct({
    id: Schema.number,
    first_name: Schema.string,
    last_name: Schema.string,
  });
  const user = Route('users')
    [':>'](Capture.number('id'))
    [':>'](
      group(
        (Get([PlainText], User),
        RequestBody(User, JSON)[':>'](Put([JSON], User))),
      ),
    );
  type UserApi = typeof user;
  type UserHandler = DeriveHandler<IdentityK, UserApi>;

  const api = group(user, version);
  type apiType = typeof api;
  type apiHandler = DeriveHandler<IdentityK, apiType>;

  type DeriveHandler<F, A> = A extends ApiList<infer X>
    ? DeriveApiElements<F, X>
    : A extends ApiGroup<infer X>
    ? DeriveApiGroup<F, X>
    : never;

  type DeriveApiGroup<F, A> = A extends [infer X, ...infer Y]
    ? [DeriveHandler<F, X>, ...DeriveApiGroup<F, Y>]
    : A extends []
    ? []
    : never;

  type DeriveApiElements<F, A> = A extends [ApiGroup<infer X>]
    ? DeriveApiGroup<F, X>
    : A extends [PathElement<any>, ...infer X]
    ? DeriveApiElements<F, X>
    : A extends [CaptureElement<any, infer V>, ...infer X]
    ? (v: V) => DeriveApiElements<F, X>
    : A extends [RequestBodyElement<infer B, any>, ...infer X]
    ? (b: B) => DeriveApiElements<F, X>
    : A extends [EndpointContentElement<any, any, any, infer R, any>]
    ? Kind<F, [R]>
    : never;
});
