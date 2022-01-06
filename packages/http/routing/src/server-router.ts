// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import {
  Applicative,
  Either,
  Kleisli,
  List,
  Monad,
  Option,
  OptionT,
  Right,
} from '@fp4ts/cats';
import {
  Attributes,
  Http,
  HttpApp,
  HttpRoutes,
  Method,
  Path,
  Uri,
} from '@fp4ts/http-core';
import { Route } from './route';
import { Handler } from './handler';
import { TrieRouter } from './trie-router';
import { PathComponent } from './path-component';

export class ServerRouter<F> {
  public constructor(
    private readonly router: TrieRouter<Handler<F>> = TrieRouter.empty,
  ) {}

  public toHttpRoutes(F: Applicative<F>): HttpRoutes<F> {
    return Kleisli(req =>
      this.routeUri(req.method, req.uri).fold(
        () => OptionT.none(F),
        ([h, parameters]) =>
          OptionT.liftF(F)(
            h.run(req.withAttributes(req.attributes.union(parameters))),
          ),
      ),
    );
  }

  public toHttpApp(F: Monad<F>): HttpApp<F> {
    return pipe(this.toHttpRoutes(F), HttpRoutes.orNotFound(F));
  }

  public routePath(
    method: Method,
    path: Path,
  ): Option<[Handler<F>, Attributes]> {
    return this.router.route(
      List.fromArray(path.components).prepend(method.methodName),
    );
  }
  public routeUri(method: Method, uri: Uri): Option<[Handler<F>, Attributes]> {
    return this.routePath(method, uri.path);
  }

  public registerRoute(route: Route<F>): Either<Error, ServerRouter<F>> {
    return this.router
      .register(
        route.path.prepend(PathComponent.fromString(route.method.methodName)),
        route.handler,
      )
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
