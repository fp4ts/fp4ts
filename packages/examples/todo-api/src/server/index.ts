// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Map } from '@fp4ts/cats';
import { Async, Resource } from '@fp4ts/effect';
import { serve, NodeServer } from '@fp4ts/http-node-server';

import { Server } from './server';
import { Todo } from '../todo';
import { TodoService } from './todo-service';

export const makeServer =
  <F>(F: Async<F>) =>
  (port: number = 3000): Resource<F, NodeServer> => {
    const R = Resource.Async(F);
    return R.do(function* (_) {
      const ids = yield* _(Resource.evalF(F.ref(0)));
      const repo = yield* _(
        Resource.evalF(F.ref(Map.empty as Map<number, Todo>)),
      );

      const todoService = new TodoService(F, ids, repo);
      const server = new Server(F, todoService);

      return yield* _(serve(F)(server.toHttpApp, port));
    });
  };
