// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeOf } from '@fp4ts/core';
import { Schema } from '@fp4ts/schema';

export const Todo = Schema.struct({
  id: Schema.number,
  text: Schema.string,
  description: Schema.string.nullable,
  completed: Schema.boolean,
}).as('todo-api/todo');
export type Todo = TypeOf<typeof Todo>;

export const CreateTodo = Schema.struct({
  text: Schema.string,
  description: Schema.string.nullable,
}).as('todo-api/create-todo');
export type CreateTodo = TypeOf<typeof CreateTodo>;
