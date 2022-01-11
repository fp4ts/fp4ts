// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  typeDef,
} from '@fp4ts/http-dsl';
import { Schema } from '@fp4ts/schema';
import { CreateTodo, Todo } from '../todo';
import { pagination } from './pagination';

export const TodoArrayType = typeDef('todo-api/todo-array', Schema.array(Todo));
export const TodoType = typeDef('todo-api/todo', Todo);
export const CreateTodoType = typeDef('todo-api/create-todo', CreateTodo);

export const todoApi = group(
  pagination[':>'](Get(JSON, TodoArrayType)),
  ReqBody(JSON, CreateTodoType)[':>'](PostCreated(JSON, TodoType)),
  Capture.number('todoId')[':>'](
    group(
      Get(JSON, TodoType),
      DeleteNoContent,
      Route('mark_complete')[':>'](Put(JSON, TodoType)),
      Route('un_mark_complete')[':>'](Put(JSON, TodoType)),
    ),
  ),
);
