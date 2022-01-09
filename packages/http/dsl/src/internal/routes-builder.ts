// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import {
  Either,
  Kleisli,
  Monad,
  None,
  Option,
  OptionT,
  OptionTK,
} from '@fp4ts/cats';
import { $, Kind } from '@fp4ts/core';
import { HttpRoutes, Method, Request, Response } from '@fp4ts/http-core';
import { CaptureParam } from '../capture';
import { QueryParam } from '../query';

export const routesBuilder = <F>(F: Monad<F>): RoutesBuilder<F> => {
  const Alt = Kleisli.Alternative<$<OptionTK, [F]>, Request<F>>(
    OptionT.Alternative(F),
  );
  const parseRoute: RoutesBuilder<F> = function (...xs: any[]): HttpRoutes<F> {
    const [handler] = xs.splice(xs.length - 1);

    const loop = (
      req: Request<F>,
      path: readonly string[],
      rem: readonly any[],
      acc: Record<string, any>,
    ): OptionT<F, Response<F>> => {
      if (rem.length === 0) {
        const res = handler({ req, ...acc });
        return res instanceof Response
          ? OptionT.some(F)(res)
          : OptionT.liftF(F)(res);
      }

      if (rem[0] instanceof QueryParam)
        return req.uri.query.lookup(rem[0].name).fold(
          () => OptionT.none(F),
          (ox: any) =>
            ox
              .traverse(Either.Applicative())((x: any) => rem[0].parser(x))
              .fold(
                (e: any) => OptionT.some(F)(e.toHttpResponse(req.httpVersion)),
                (ox: any) =>
                  loop(req, path, rem.slice(1), {
                    ...acc,
                    [rem[0].name]: ox,
                  }),
              ),
        );

      if (rem[0] instanceof Method)
        return rem[0] === req.method
          ? loop(req, path, rem.slice(1), acc)
          : OptionT.none(F);

      if (path.length === 0) return OptionT.none(F);

      if (rem[0] instanceof CaptureParam)
        return rem[0].parser(path[0]).fold(
          e => OptionT.some(F)(e.toHttpResponse(req.httpVersion)),
          x =>
            loop(req, path.slice(1), rem.slice(1), {
              ...acc,
              [rem[0].name]: x,
            }),
        );

      return rem[0] === path[0]
        ? loop(req, path.slice(1), rem.slice(1), acc)
        : OptionT.none(F);
    };

    return Kleisli((req: Request<F>) => {
      return loop(req, req.uri.path.components.slice(1), xs, {});
    });
  };

  parseRoute.group = function (...xs) {
    return xs.reduceRight(
      (acc, next) => Alt.orElse_(next, () => acc),
      Alt.emptyK(),
    );
  };

  return parseRoute;
};

export interface RoutesBuilder<F> {
  <P extends [Method, ...unknown[]]>(
    ...xs: [
      ...P,
      (
        extracted: ToExtracted<P, { req: Request<F> }>,
      ) => Response<F> | Kind<F, [Response<F>]>,
    ]
  ): HttpRoutes<F>;

  group(...xs: HttpRoutes<F>[]): HttpRoutes<F>;
}

// prettier-ignore
export type ToExtracted<xs extends unknown[], out extends {} = {}> =
  xs extends [CaptureParam<infer S, infer A>, ...infer ys]
    ? ToExtracted<ys, { [k in keyof out | S]:
                          k extends S         ? A
                        : k extends keyof out ? out[k]
                        : never;
                      }>
  : xs extends [QueryParam<infer S, infer A>, ...infer ys]
    ? ToExtracted<ys, { [k in keyof out | S]:
                          k extends S         ? Option<A>
                        : k extends keyof out ? out[k]
                        : never;
                      }>
  : xs extends [any, ...infer ys]
    ? ToExtracted<ys, out>
  : out;
