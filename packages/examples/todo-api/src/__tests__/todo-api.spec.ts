// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import test from 'supertest';
import { IO } from '@fp4ts/effect';
import { NodeServer } from '@fp4ts/http-node-server';
import { withServerResource } from '@fp4ts/http-test-kit-node';
import { makeApp } from '../server';
import { SqliteTransactor } from '@fp4ts/sql-sqlite';

describe('Todo api', () => {
  const serverResource = SqliteTransactor.memory(IO.Async).evalMap(trx =>
    makeApp(IO.Async, trx),
  );

  describe('/version', () => {
    it('should return 200 Ok', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying).get('/version'),
        ).flatMap(response => IO(() => expect(response.statusCode).toBe(200))),
      ).unsafeRunToPromise());

    it('should return v1.0.0', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying).get('/version'),
        ).flatMap(response => IO(() => expect(response.text).toBe('v1.0.0'))),
      ).unsafeRunToPromise());
  });

  describe('Todos', () => {
    it('should return 400 Bad Request when no query params are provided', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying).get('/todo?limit'),
        ).flatMap(response => IO(() => expect(response.statusCode).toBe(400))),
      ).unsafeRunToPromise());

    it('should return 200 Ok', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying).get(
            '/todo?limit=100&offset=0',
          ),
        ).flatMap(response => IO(() => expect(response.statusCode).toBe(200))),
      ).unsafeRunToPromise());

    it('should return a single, incomplete todo', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying)
            .post('/todo')
            .send({ text: 'Sample todo', description: null })
            .then(() =>
              test((server as NodeServer).underlying).get(
                '/todo?limit=100&offset=0',
              ),
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
      ).unsafeRunToPromise());

    it('should return a two, incomplete todos', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying)
            .post('/todo')
            .send({ text: 'Sample todo 1', description: null })
            .then(() =>
              test((server as NodeServer).underlying)
                .post('/todo')
                .send({ text: 'Sample todo 2', description: null }),
            )
            .then(() =>
              test((server as NodeServer).underlying).get(
                '/todo?limit=100&offset=0',
              ),
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
      ).unsafeRunToPromise());

    it('should return 404 when the todo with the given ID does not exist', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying)
            .post('/todo')
            .send({ text: 'Sample todo', description: null })
            .then(() =>
              test((server as NodeServer).underlying).get('/todo/42'),
            ),
        ).flatMap(response => IO(() => expect(response.statusCode).toBe(404))),
      ).unsafeRunToPromise());

    it('should return id with the given ID', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying)
            .post('/todo')
            .send({ text: 'Sample todo', description: null })
            .then(() => test((server as NodeServer).underlying).get('/todo/1')),
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
      ).unsafeRunToPromise());

    it('should complete an existing todo ', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying)
            .post('/todo')
            .send({ text: 'Sample todo', description: null })
            .then(() =>
              test((server as NodeServer).underlying).put(
                '/todo/1/mark_complete',
              ),
            )
            .then(() => test((server as NodeServer).underlying).get('/todo/1')),
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
      ).unsafeRunToPromise());

    it('should un-mark complete an existing todo', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying)
            .post('/todo')
            .send({ text: 'Sample todo', description: null })
            .then(() =>
              test((server as NodeServer).underlying).put(
                '/todo/1/mark_complete',
              ),
            )
            .then(() =>
              test((server as NodeServer).underlying).put(
                '/todo/1/un_mark_complete',
              ),
            )
            .then(() => test((server as NodeServer).underlying).get('/todo/1')),
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
      ).unsafeRunToPromise());

    it('should delete an existing todo', async () =>
      withServerResource(serverResource)(server =>
        IO.deferPromise(() =>
          test((server as NodeServer).underlying)
            .post('/todo')
            .send({ text: 'Sample todo', description: null })
            .then(() =>
              test((server as NodeServer).underlying).delete('/todo/1'),
            )
            .then(() =>
              test((server as NodeServer).underlying).get(
                '/todo?limit=100&offset=0',
              ),
            ),
        ).flatMap(response =>
          IO(() => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([]);
          }),
        ),
      ).unsafeRunToPromise());
  });
});
