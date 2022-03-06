// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { numberType, typeref } from '@fp4ts/core';
import {
  Capture,
  DeleteNoContent,
  Get,
  group,
  JSON,
  PostCreated,
  Put,
  ReqBody,
  Route,
} from '@fp4ts/http-dsl';
import { CreateTodo, Todo } from '../todo';
import { pagination } from './pagination';

export const TodoArrayType = typeref<Todo[]>()('todo-api/todo-array');
export const TodoType = typeref<Todo>()('todo-api/todo');
export const CreateTodoType = typeref<CreateTodo>()('todo-api/create-todo');

export const todoApi = group(
  pagination[':>'](Get(JSON, TodoArrayType)),
  ReqBody(JSON, CreateTodoType)[':>'](PostCreated(JSON, TodoType)),
  Capture('todoId', numberType)[':>'](
    group(
      Get(JSON, TodoType),
      DeleteNoContent,
      Route('mark_complete')[':>'](Put(JSON, TodoType)),
      Route('un_mark_complete')[':>'](Put(JSON, TodoType)),
    ),
  ),
);
