// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Applicative,
  Either,
  Kleisli,
  List,
  Option,
  OptionT,
  Right,
} from '@fp4ts/cats';
import { Attributes, HttpRoutes, Path, Uri } from '@fp4ts/http-core';
import { Handler } from './handler';
import { Route } from './route';
import { TrieRouter } from './trie-router';

export class ServerRouter<F> {
  public constructor(
    private readonly router: TrieRouter<Handler<F>> = TrieRouter.empty,
  ) {}

  public toHttpRoutes(F: Applicative<F>): HttpRoutes<F> {
    return Kleisli(req =>
      this.routeUri(req.uri).fold(
        () => OptionT.none(F),
        ([h, parameters]) =>
          h.run(req.withAttributes(req.attributes.union(parameters))),
      ),
    );
  }

  public routePath(path: Path): Option<[Handler<F>, Attributes]> {
    return this.router.route(List.fromArray(path.components));
  }
  public routeUri(uri: Uri): Option<[Handler<F>, Attributes]> {
    return this.routePath(uri.path);
  }

  public registerRoute(route: Route<F>): Either<Error, ServerRouter<F>> {
    return this.router
      .register(route.path, route.handler)
      .map(router => new ServerRouter(router));
  }

  public registerRoutes(
    routes: List<Route<F>>,
  ): Either<Error, ServerRouter<F>> {
    return routes.foldLeft<Either<Error, ServerRouter<F>>>(
      Right(this),
      (er, route) => er.flatMap(r => r.registerRoute(route)),
    );
  }
}
