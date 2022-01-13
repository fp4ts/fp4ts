// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherT } from '@fp4ts/cats';
import { Async } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http';
import { Codable, toHttpApp } from '@fp4ts/http-dsl-server';

import { CreateTodo, Todo } from '../todo';
import { TodoService } from './todo-service';

import { api, TodoArrayType } from '../api';
import { version } from './version';

export class Server<F> {
  public constructor(
    private readonly F: Async<F>,
    private readonly todos: TodoService<F>,
  ) {}

  public get toHttpApp(): HttpApp<F> {
    return toHttpApp(this.F)(
      api,
      [
        version(this.F),
        [
          limit => offset =>
            EitherT.liftF(this.F)(this.todos.getAll(limit, offset)),
          newTodo => EitherT.liftF(this.F)(this.todos.create(newTodo)),
          todoId => [
            EitherT(this.todos.getById(todoId)),
            EitherT.liftF(this.F)(this.todos.deleteById(todoId)),
            EitherT(this.todos.markComplete(todoId)),
            EitherT(this.todos.unMarkComplete(todoId)),
          ],
        ],
      ],
      {
        'application/json': {
          'todo-api/create-todo': Codable.json.fromSchema(CreateTodo),
          'todo-api/todo': Codable.json.fromSchema(Todo),
          'todo-api/todo-array': Codable.json.fromSchema(TodoArrayType.schema),
        },
      },
    );
  }
}
