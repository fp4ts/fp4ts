// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { numberType } from '@fp4ts/core';
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

export const todoApi = group(
  pagination[':>'](Get(JSON, Todo.schema.array.as('todo-api/todo-array'))),
  ReqBody(JSON, CreateTodo)[':>'](PostCreated(JSON, Todo)),
  Capture('todoId', numberType)[':>'](
    group(
      Get(JSON, Todo),
      DeleteNoContent,
      Route('mark_complete')[':>'](Put(JSON, Todo)),
      Route('un_mark_complete')[':>'](Put(JSON, Todo)),
    ),
  ),
);
