// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kleisli, Monad, OptionT } from '@fp4ts/cats';
import {
  Http,
  HttpRoutes,
  Method,
  Request,
  Response,
  Status,
} from '@fp4ts/http-core';

export type Router<env, a> =
  | StaticRouter<env, a>
  | CaptureRouter<env, a>
  | Choice<env, a>;

export class StaticRouter<env, a> {
  public readonly tag = 'static';
  public constructor(
    public readonly table: Record<string, Router<env, a>>,
    public readonly matches: Record<string, (e: env) => a> = {},
  ) {}
}

export class CaptureRouter<env, a> {
  public readonly tag = 'capture';
  public constructor(public readonly next: Router<[string, env], a>) {}
}

export class Choice<env, a> {
  public readonly tag = 'choice';
  public constructor(
    public readonly lhs: Router<env, a>,
    public readonly rhs: Router<env, a>,
  ) {}
}

export const pathRouter = <env, a>(
  p: string,
  r: Router<env, a>,
): Router<env, a> => new StaticRouter({ [p]: r });

export const leafRouter = <env, a>(
  method: Method,
  l: (e: env) => a,
): Router<env, a> => new StaticRouter({}, { [method.methodName]: l });

export const choice = <env, a>(...xs: Router<env, a>[]): Router<env, a> =>
  xs.reduce(merge);

const merge = <env, a>(
  lhs: Router<env, a>,
  rhs: Router<env, a>,
): Router<env, a> => {
  if (lhs.tag === 'static' && rhs.tag === 'static') {
    return new StaticRouter(
      mergeWith(lhs.table, rhs.table, merge),
      mergeWith(lhs.matches, rhs.matches, l => l),
    );
  } else if (lhs.tag === 'capture' && rhs.tag === 'capture') {
    return new CaptureRouter(merge(lhs.next, rhs.next));
  } else if (rhs.tag === 'choice') {
    return new Choice(merge(lhs, rhs.lhs), rhs.rhs);
  }
  return new Choice(lhs, rhs);
};

const mergeWith = <a>(
  lhs: Record<string, a>,
  rhs: Record<string, a>,
  f: (l: a, r: a) => a,
): Record<string, a> => {
  const results: Record<string, a> = {};
  for (const k of new Set([...Object.keys(lhs), ...Object.keys(rhs)])) {
    if (k in lhs && k in rhs) {
      results[k] = f(lhs[k], rhs[k]);
    } else if (k in lhs) {
      results[k] = lhs[k];
    } else {
      results[k] = rhs[k];
    }
  }
  return results;
};

export const runRouterEnv =
  <F>(F: Monad<F>) =>
  <env>(router: Router<env, Http<F, F>>, env: env): HttpRoutes<F> => {
    const loop = <env>(
      req: Request<F>,
      router: Router<env, Http<F, F>>,
      env: env,
      rem: readonly string[],
    ): OptionT<F, Response<F>> => {
      switch (router.tag) {
        case 'static': {
          if (rem.length === 0) {
            if (req.method.methodName === 'HEAD' && router.matches['GET']) {
              return OptionT.liftF(F)(router.matches['GET'](env).run(req));
            }

            // pick one of the end routes as we have a match
            const methodMatch = router.matches[req.method.methodName];
            if (!methodMatch)
              if (Object.keys(router).length > 0)
                return OptionT.some(F)(
                  new Response<F>(Status.MethodNotAllowed),
                );
              else OptionT.none(F);
            return OptionT.liftF(F)(methodMatch(env).run(req));
          }

          if (router.table[rem[0]]) {
            return loop(req, router.table[rem[0]], env, rem.slice(1));
          }

          return OptionT.none(F);
        }

        case 'capture': {
          if (rem.length === 0)
            // nothing to capture
            return OptionT.none(F);

          const [pfx, ...sfx] = rem;
          return loop(req, router.next, [pfx, env], sfx);
        }

        case 'choice':
          return loop(req, router.lhs, env, rem).orElse(F)(() =>
            loop(req, router.rhs, env, rem),
          );
      }
    };

    return Kleisli(req => {
      // ensure to trip the leading '' introduced by /
      const pathComponents = req.uri.path.components.slice(1);
      // ensure to trip the trailing '' introduced by /
      const routablePathComponents =
        pathComponents[pathComponents.length - 1] === ''
          ? pathComponents.slice(0, pathComponents.length - 1)
          : pathComponents;
      return loop(req, router, env, routablePathComponents);
    });
  };
