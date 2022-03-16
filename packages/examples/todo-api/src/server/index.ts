// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { EitherT, Map } from '@fp4ts/cats';
import { Async } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http';

import { CreateTodo, Todo } from '../todo';
import { TodoService } from './todo-service';
import { builtins, Codable, toHttpApp } from '@fp4ts/http-dsl-server';
import { api } from '../api';
import { version } from './version';

export const makeApp = <F>(F: Async<F>): Kind<F, [HttpApp<F>]> => {
  return F.do(function* (_) {
    const ids = yield* _(F.ref(0));
    const repo = yield* _(F.ref(Map.empty as Map<number, Todo>));

    const todoService = new TodoService(F, ids, repo);

    return toHttpApp(F)(api, {
      ...builtins,
      'application/json': {
        'todo-api/create-todo': Codable.json.fromSchema(CreateTodo),
        'todo-api/todo': Codable.json.fromSchema(Todo),
        'todo-api/todo-array': Codable.json.fromSchema(Todo.array),
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
