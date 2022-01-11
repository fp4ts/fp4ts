// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { OrderedMap } from '@fp4ts/cats';
import { Kind, pipe } from '@fp4ts/core';
import { Async, Resource } from '@fp4ts/effect';
import { serve } from '@fp4ts/http-node-server';

import { Todo } from '../todo';
import { TodoService } from './todo-service';
import { Server } from './server';

export const runServer =
  <F>(F: Async<F>) =>
  (port: number = 3000): Kind<F, [Resource<F, http.Server>]> =>
    pipe(
      F.Do,
      F.bindTo('ids', F.ref(0)),
      F.bindTo('repo', F.ref(OrderedMap.empty as OrderedMap<number, Todo>)),
      F.bindTo('todoService', ({ ids, repo }) =>
        F.pure(new TodoService(F, ids, repo)),
      ),
      F.bindTo('server', ({ todoService }) =>
        F.pure(new Server(F, todoService)),
      ),
      F.map(({ server }) => serve(F)(server.toHttpApp, port)),
    );
