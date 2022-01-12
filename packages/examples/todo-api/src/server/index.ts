// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { OrderedMap } from '@fp4ts/cats';
import { pipe } from '@fp4ts/core';
import { Async, Resource } from '@fp4ts/effect';
import { serve } from '@fp4ts/http-node-server';

import { Server } from './server';
import { Todo } from '../todo';
import { TodoService } from './todo-service';

export const makeServer =
  <F>(F: Async<F>) =>
  (port: number = 3000): Resource<F, http.Server> => {
    const R = Resource.Async(F);
    return pipe(
      R.Do,
      R.bindTo('ids', Resource.evalF(F.ref(0))),
      R.bindTo(
        'repo',
        Resource.evalF(F.ref(OrderedMap.empty as OrderedMap<number, Todo>)),
      ),
      R.let('todoService', ({ ids, repo }) => new TodoService(F, ids, repo)),
      R.let('server', ({ todoService }) => new Server(F, todoService)),
      R.flatMap(({ server }) => serve(F)(server.toHttpApp, port)),
    );
  };
