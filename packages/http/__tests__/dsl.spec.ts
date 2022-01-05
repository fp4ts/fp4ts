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
  Root,
  Route,
  WithStatus,
  JSON,
  PlainText,
} from '@fp4ts/http-dsl';

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

    const api = Root[':>'](group(users, movies, version));

    console.log(global.JSON.stringify(api, null, 2));
  });
});
