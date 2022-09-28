// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either, Option } from '@fp4ts/cats';
import { MessageFailure, NotFoundFailure } from '@fp4ts/http';
import { ConnectionIO, sql } from '@fp4ts/sql';
import { SqliteTransactor } from '@fp4ts/sql-sqlite';
import { CreateTodo, Todo } from '../todo';

interface SqliteTodo {
  readonly id: number;
  readonly text: string;
  readonly description: string | null;
  readonly completed: number;
}

const fromSqlite = ({ completed, ...todo }: SqliteTodo): Todo => ({
  ...todo,
  completed: Boolean(completed),
});

export class TodoService<F> {
  public constructor(private readonly trx: SqliteTransactor<F>) {}

  public getAll = (
    limit: Option<number>,
    offset: Option<number>,
  ): Kind<F, [Todo[]]> =>
    sql`SELECT *
      | FROM todo
      | LIMIT ${limit.getOrElse(() => 100)}
      | OFFSET ${offset.getOrElse(() => 0)}`
      .stripMargin()
      .query<SqliteTodo>()
      .map(fromSqlite)
      .toArray()
      .transact(this.trx);

  public create = (todo: CreateTodo): Kind<F, [Todo]> =>
    sql`INSERT INTO todo(text, description)
      | VALUES (${todo.text}, ${todo.description})
      | RETURNING *`
      .stripMargin()
      .update()
      .updateReturning<SqliteTodo>()
      .map(fromSqlite)
      .compileConcurrent(ConnectionIO.Async)
      .head.transact(this.trx);

  public getById = (id: number): Kind<F, [Either<MessageFailure, Todo>]> =>
    sql`SELECT *
      | FROM todo
      | WHERE id = ${id}`
      .stripMargin()
      .query<SqliteTodo>()
      .map(fromSqlite)
      .toOption()
      .map(opt =>
        opt.toRight(() => new NotFoundFailure(`Todo with ID ${id} not found`)),
      )
      .transact(this.trx);

  public markComplete = (id: number): Kind<F, [Either<MessageFailure, Todo>]> =>
    sql`UPDATE todo
      | SET completed = TRUE
      | WHERE id = ${id}
      | RETURNING *`
      .stripMargin()
      .update()
      .updateReturning<SqliteTodo>()
      .map(fromSqlite)
      .compileConcurrent(ConnectionIO.Async)
      .headOption.map(opt =>
        opt.toRight(() => new NotFoundFailure(`Todo with ID ${id} not found`)),
      )
      .transact(this.trx);

  public unMarkComplete = (
    id: number,
  ): Kind<F, [Either<MessageFailure, Todo>]> =>
    sql`UPDATE todo
      | SET completed = FALSE
      | WHERE id = ${id}
      | RETURNING *`
      .stripMargin()
      .update()
      .updateReturning<SqliteTodo>()
      .map(fromSqlite)
      .compileConcurrent(ConnectionIO.Async)
      .headOption.map(opt =>
        opt.toRight(() => new NotFoundFailure(`Todo with ID ${id} not found`)),
      )
      .transact(this.trx);

  public deleteById = (id: number): Kind<F, [void]> =>
    sql`DELETE FROM todo WHERE id = ${id}`
      .update()
      .run()
      .map(() => {})
      .void.transact(this.trx);
}
