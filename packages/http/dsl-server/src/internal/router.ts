// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kleisli, Monad } from '@fp4ts/cats';
import { $ } from '@fp4ts/core';
import { NotFoundFailure, Request } from '@fp4ts/http-core';
import { RouteResultT, RouteResultTK } from './route-result';
import { RoutingApplication } from './routing-application';

export type Router<env, a> =
  | StaticRouter<env, a>
  | CaptureRouter<env, a>
  | Choice<env, a>;

export class StaticRouter<env, a> {
  public readonly tag = 'static';
  public constructor(
    public readonly table: Record<string, Router<env, a>>,
    public readonly matches: ((e: env) => a)[] = [],
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

export const leafRouter = <env, a>(l: (e: env) => a): Router<env, a> =>
  new StaticRouter({}, [l]);

export const choice = <env, a>(...xs: Router<env, a>[]): Router<env, a> =>
  xs.reduce(merge);

const merge = <env, a>(
  lhs: Router<env, a>,
  rhs: Router<env, a>,
): Router<env, a> => {
  if (lhs.tag === 'static' && rhs.tag === 'static') {
    return new StaticRouter(mergeWith(lhs.table, rhs.table, merge), [
      ...lhs.matches,
      ...rhs.matches,
    ]);
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
  <env>(
    router: Router<env, RoutingApplication<F>>,
    env: env,
  ): RoutingApplication<F> => {
    const KA = Kleisli.Alternative<$<RouteResultTK, [F]>, Request<F>>(
      RouteResultT.Alternative(F),
    );

    const loop =
      <env>(
        req: Request<F>,
        router: Router<env, RoutingApplication<F>>,
        rem: readonly string[],
      ) =>
      (env: env): RoutingApplication<F> => {
        switch (router.tag) {
          case 'static': {
            if (rem.length === 0) {
              return runChoices(env, router.matches);
            }

            if (router.table[rem[0]]) {
              return loop(req, router.table[rem[0]], rem.slice(1))(env);
            }

            return Kleisli(() => RouteResultT.fail(F)(new NotFoundFailure()));
          }

          case 'capture': {
            if (rem.length === 0)
              // nothing to capture
              return Kleisli(() => RouteResultT.fail(F)(new NotFoundFailure()));

            const [pfx, ...sfx] = rem;
            return loop(req, router.next, sfx)([pfx, env]);
          }

          case 'choice':
            return runChoices(env, [
              loop(req, router.lhs, rem),
              loop(req, router.rhs, rem),
            ]);
        }
      };

    const runChoices = <env>(
      env: env,
      ls: ((env: env) => RoutingApplication<F>)[],
    ): RoutingApplication<F> => {
      switch (ls.length) {
        case 0:
          return Kleisli(() => RouteResultT.fail(F)(new NotFoundFailure()));

        case 1:
          return ls[0](env);

        case 2:
          return KA.orElse_(ls[0](env), () => ls[1](env));

        default: {
          const [hd, ...rest] = ls;
          return KA.orElse_(hd(env), () => runChoices(env, rest));
        }
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
      return loop(req, router, routablePathComponents)(env).run(req);
    });
  };
