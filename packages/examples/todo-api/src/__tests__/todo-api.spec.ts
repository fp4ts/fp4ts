// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import test from 'supertest';
import { IO } from '@fp4ts/effect';
import { makeServer } from '../server';

describe('Todo api', () => {
  describe('/version', () => {
    it('should return 200 Ok', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying).get('/version'),
          ).flatMap(response =>
            IO(() => expect(response.statusCode).toBe(200)),
          ),
        )
        .unsafeRunToPromise());

    it('should return v1.0.0', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying).get('/version'),
          ).flatMap(response => IO(() => expect(response.text).toBe('v1.0.0'))),
        )
        .unsafeRunToPromise());
  });

  describe('Todos', () => {
    it('should return 400 Bad Request when no query params are provided', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() => test(server.underlying).get('/todo')).flatMap(
            response => IO(() => expect(response.statusCode).toBe(400)),
          ),
        )
        .unsafeRunToPromise());

    it('should return 200 Ok', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying).get('/todo?limit=100&offset=0'),
          ).flatMap(response =>
            IO(() => expect(response.statusCode).toBe(200)),
          ),
        )
        .unsafeRunToPromise());

    it('should return a single, incomplete todo', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying)
              .post('/todo')
              .send({ text: 'Sample todo', description: null })
              .then(() =>
                test(server.underlying).get('/todo?limit=100&offset=0'),
              ),
          ).flatMap(response =>
            IO(() =>
              expect(response.body).toEqual([
                {
                  id: 1,
                  text: 'Sample todo',
                  description: null,
                  completed: false,
                },
              ]),
            ),
          ),
        )
        .unsafeRunToPromise());

    it('should return a two, incomplete todos', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying)
              .post('/todo')
              .send({ text: 'Sample todo 1', description: null })
              .then(() =>
                test(server.underlying)
                  .post('/todo')
                  .send({ text: 'Sample todo 2', description: null }),
              )
              .then(() =>
                test(server.underlying).get('/todo?limit=100&offset=0'),
              ),
          ).flatMap(response =>
            IO(() =>
              expect(response.body).toEqual([
                {
                  id: 1,
                  text: 'Sample todo 1',
                  description: null,
                  completed: false,
                },
                {
                  id: 2,
                  text: 'Sample todo 2',
                  description: null,
                  completed: false,
                },
              ]),
            ),
          ),
        )
        .unsafeRunToPromise());

    it('should return 404 when the todo with the given ID does not exist', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying)
              .post('/todo')
              .send({ text: 'Sample todo', description: null })
              .then(() => test(server.underlying).get('/todo/42')),
          ).flatMap(response =>
            IO(() => expect(response.statusCode).toBe(404)),
          ),
        )
        .unsafeRunToPromise());

    it('should return id with the given ID', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying)
              .post('/todo')
              .send({ text: 'Sample todo', description: null })
              .then(() => test(server.underlying).get('/todo/1')),
          ).flatMap(response =>
            IO(() => {
              expect(response.statusCode).toBe(200);
              expect(response.body).toEqual({
                id: 1,
                text: 'Sample todo',
                description: null,
                completed: false,
              });
            }),
          ),
        )
        .unsafeRunToPromise());

    it('should complete an existing todo ', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying)
              .post('/todo')
              .send({ text: 'Sample todo', description: null })
              .then(() => test(server.underlying).put('/todo/1/mark_complete'))
              .then(() => test(server.underlying).get('/todo/1')),
          ).flatMap(response =>
            IO(() => {
              expect(response.statusCode).toBe(200);
              expect(response.body).toEqual({
                id: 1,
                text: 'Sample todo',
                description: null,
                completed: true,
              });
            }),
          ),
        )
        .unsafeRunToPromise());

    it('should un-mark complete an existing todo', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying)
              .post('/todo')
              .send({ text: 'Sample todo', description: null })
              .then(() => test(server.underlying).put('/todo/1/mark_complete'))
              .then(() =>
                test(server.underlying).put('/todo/1/un_mark_complete'),
              )
              .then(() => test(server.underlying).get('/todo/1')),
          ).flatMap(response =>
            IO(() => {
              expect(response.statusCode).toBe(200);
              expect(response.body).toEqual({
                id: 1,
                text: 'Sample todo',
                description: null,
                completed: false,
              });
            }),
          ),
        )
        .unsafeRunToPromise());

    it('should delete an existing todo', async () =>
      makeServer(IO.Async)(3000)
        .use(IO.Async)(server =>
          IO.deferPromise(() =>
            test(server.underlying)
              .post('/todo')
              .send({ text: 'Sample todo', description: null })
              .then(() => test(server.underlying).delete('/todo/1'))
              .then(() =>
                test(server.underlying).get('/todo?limit=100&offset=0'),
              ),
          ).flatMap(response =>
            IO(() => {
              expect(response.statusCode).toBe(200);
              expect(response.body).toEqual([]);
            }),
          ),
        )
        .unsafeRunToPromise());
  });
});
