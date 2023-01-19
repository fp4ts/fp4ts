// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { EitherT } from '@fp4ts/cats';
import { Async } from '@fp4ts/effect';
import { JsonCodec } from '@fp4ts/schema-json';
import { HttpApp } from '@fp4ts/http';
import { builtins, toHttpApp } from '@fp4ts/http-dsl-server';
import { sql } from '@fp4ts/sql';
import { SqliteTransactor } from '@fp4ts/sql-sqlite';

import { CreateTodo, Todo } from '../todo';
import { TodoService } from './todo-service';
import { api } from '../api';
import { version } from './version';

export const makeApp = <F>(
  F: Async<F>,
  trx: SqliteTransactor<F>,
): Kind<F, [HttpApp<F>]> => {
  return F.do(function* (_) {
    yield* _(
      sql`CREATE TABLE IF NOT EXISTS todo (
       |  id          INTEGER PRIMARY KEY,
       |  text        TEXT NOT NULL,
       |  description TEXT,
       |  completed   INT NOT NULL DEFAULT FALSE
       |)`
        .stripMargin()
        .update()
        .run()
        .transact(trx),
    );

    const todoService = new TodoService(trx);

    return toHttpApp(F)(api, {
      ...builtins,
      'application/json': {
        'todo-api/create-todo': JsonCodec.fromSchema(CreateTodo.schema),
        'todo-api/todo': JsonCodec.fromSchema(Todo.schema),
        'todo-api/todo-array': JsonCodec.fromSchema(Todo.schema.array),
      },
    })(S => [
      version(F),
      [
        limit => offset => S.liftF(todoService.getAll(limit, offset)),
        newTodo => S.liftF(todoService.create(newTodo)),
        todoId => [
          EitherT(todoService.getById(todoId)),
          S.liftF(todoService.deleteById(todoId)),
          EitherT(todoService.markComplete(todoId)),
          EitherT(todoService.unMarkComplete(todoId)),
        ],
      ],
    ]);
  });
};
