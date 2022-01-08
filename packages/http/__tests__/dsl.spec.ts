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
  Post,
  Put,
  PutNoContent,
  QueryParam,
  ReqBody,
  Route,
  JSON,
  PlainText,
  PostCreated,
  GetNoContent,
} from '@fp4ts/http-dsl';

describe('dsl', () => {
  it('should run', () => {
    const User = Schema.struct({
      id: Schema.number,
      first_name: Schema.string,
      last_name: Schema.string,
    });

    const pagination = QueryParam.number('limit')[':>'](
      QueryParam.number('offset'),
    );

    const crudApi = <T extends string, S>(T: T, S: Schema<S>) =>
      Route(`${T}s`)[':>'](
        group(
          pagination[':>'](Get([JSON], Schema.array(S))),
          ReqBody([JSON], S)[':>'](PostCreated([JSON], S)),
          Capture.number(`${T}_id`)[':>'](
            group(
              ReqBody([JSON], S)[':>'](Put([JSON], S)),
              Get([JSON], S),
              DeleteNoContent,
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

    const movies = Route('movies')[':>'](
      group(
        pagination[':>']('my_list')[':>'](Get([JSON], Schema.array(Movie))),
        Route('stream')
          [':>'](QueryParam.number('movie_id'))
          [':>'](Post([JSON], Streaming)),
        Route('stream')
          [':>'](Capture.number('streaming_id'))
          [':>'](
            group(
              Route('pause')[':>'](PutNoContent),
              Route('resume')[':>'](PutNoContent),
            ),
          ),
      ),
    );

    const version = Route('version')[':>'](Get([PlainText], Schema.string));

    const api = group(users, movies, version);

    console.log(global.JSON.stringify(api, null, 2));
  });
});
