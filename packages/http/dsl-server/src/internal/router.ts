// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe, tupled } from '@fp4ts/core';
import { Monad } from '@fp4ts/cats';
import { Schema, Schemable } from '@fp4ts/schema';
import { NotFoundFailure, Path, Request, Response } from '@fp4ts/http-core';
import { RouteResultT } from './route-result';
import { RoutingApplication } from './routing-application';

export type Router<env, a> =
  | StaticRouter<env, a>
  | RawRouter<env, a>
  | CaptureRouter<env, a>
  | Choice<env, a>
  | CatchAllRouter<env, a>;

abstract class BaseRouter {
  public toString(this: Router<any, any>): string {
    return routerLayout(this);
  }
}

export class StaticRouter<env, a> extends BaseRouter {
  public readonly tag = 'static';
  public constructor(
    public readonly table: Record<string, Router<env, a>>,
    public readonly matches: ((e: env) => a)[] = [],
  ) {
    super();
  }
}

export class CaptureRouter<env, a> extends BaseRouter {
  public readonly tag = 'capture';
  public constructor(public readonly next: Router<[string, env], a>) {
    super();
  }
}

export class CatchAllRouter<env, a> extends BaseRouter {
  public readonly tag = 'catch-all';
  public constructor(public readonly next: Router<[string[], env], a>) {
    super();
  }
}

export class RawRouter<env, a> extends BaseRouter {
  public readonly tag = 'raw';
  public constructor(public readonly app: (env: env) => a) {
    super();
  }
}

export class Choice<env, a> extends BaseRouter {
  public readonly tag = 'choice';
  public constructor(
    public readonly lhs: Router<env, a>,
    public readonly rhs: Router<env, a>,
  ) {
    super();
  }
}

export const pathRouter = <env, a>(
  p: string,
  r: Router<env, a>,
): Router<env, a> => new StaticRouter({ [p]: r });

export const leafRouter = <env, a>(l: (e: env) => a): Router<env, a> =>
  new StaticRouter({}, [l]);

export const choice = <env, a>(...xs: Router<env, a>[]): Router<env, a> =>
  xs.reduceRight((acc, x) => merge(x, acc));

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
    const loop =
      <env>(
        req: Request<F>,
        router: Router<env, RoutingApplication<F>>,
        rem: string[],
      ) =>
      (env: env): RouteResultT<F, Response<F>> => {
        switch (router.tag) {
          case 'static': {
            if (rem.length === 0) {
              return runChoices(req, env, router.matches);
            }

            if (router.table[rem[0]]) {
              return loop(req, router.table[rem[0]], rem.slice(1))(env);
            }

            return RouteResultT.fail(F)(new NotFoundFailure());
          }

          case 'capture': {
            if (rem.length === 0)
              // nothing to capture
              return RouteResultT.fail(F)(new NotFoundFailure());

            const [pfx, ...sfx] = rem;
            return loop(req, router.next, sfx)([pfx, env]);
          }

          case 'catch-all': {
            return loop(req, router.next, [])([rem, env]);
          }

          case 'raw':
            return router.app(env)(
              // pass remainder of the path to the raw router
              // Note: We always artificially prepend absolute path in case
              //       an empty segment is encountered
              req.withUri(req.uri.withPath(new Path(['', ...rem]))),
            );

          case 'choice':
            return loop(req, router.lhs, rem)(env).orElse(F)(() =>
              loop(req, router.rhs, rem)(env),
            );
        }
      };

    const runChoices = <env>(
      req: Request<F>,
      env: env,
      ls: ((env: env) => RoutingApplication<F>)[],
    ): RouteResultT<F, Response<F>> => {
      switch (ls.length) {
        case 0:
          return RouteResultT.fail(F)(new NotFoundFailure());

        case 1:
          return ls[0](env)(req);

        case 2:
          return ls[0](env)(req).orElse(F)(() => ls[1](env)(req));

        default: {
          const [hd, ...rest] = ls;
          return hd(env)(req).orElse(F)(() => runChoices(req, env, rest));
        }
      }
    };

    return req => {
      const path = req.uri.path;
      // ensure to trip the leading '' introduced by /
      const pathComponents = req.uri.path.isAbsolute
        ? path.components.slice(1)
        : path.components;
      // ensure to trip the trailing '' introduced by /
      const routablePathComponents =
        pathComponents[pathComponents.length - 1] === ''
          ? pathComponents.slice(0, pathComponents.length - 1)
          : pathComponents;
      return loop(req, router, routablePathComponents)(env);
    };
  };

export const sameStructure = <env, a, b>(
  r1: Router<env, a>,
  r2: Router<env, b>,
): boolean =>
  RouterStructureEq.equals(routerStructure(r1), routerStructure(r2));

type RouterStructure =
  | { tag: 'static'; table: Record<string, RouterStructure>; matches: number }
  | { tag: 'capture'; next: RouterStructure }
  | { tag: 'raw' }
  | { tag: 'choice'; lhs: RouterStructure; rhs: RouterStructure };

const RouterStructureS: Schema<RouterStructure> = Schema.sum('tag')({
  static: Schema.struct({
    tag: Schema.literal('static' as const),
    table: Schema.record(Schema.defer(() => RouterStructureS)),
    matches: Schema.number,
  }),
  capture: Schema.struct({
    tag: Schema.literal('capture' as const),
    next: Schema.defer(() => RouterStructureS),
  }),
  raw: Schema.struct({ tag: Schema.literal('raw' as const) }),
  choice: Schema.struct({
    tag: Schema.literal('choice' as const),
    lhs: Schema.defer(() => RouterStructureS),
    rhs: Schema.defer(() => RouterStructureS),
  }),
});

const RouterStructureEq = RouterStructureS.interpret(Schemable.Eq);

function routerStructure(router: Router<any, any>): RouterStructure {
  switch (router.tag) {
    case 'static': {
      const table = pipe(
        Object.entries(router.table).map(([k, v]) =>
          tupled(k, routerStructure(v)),
        ),
        Object.fromEntries,
      );
      return { tag: 'static', table, matches: router.matches.length };
    }

    case 'capture':
    case 'catch-all':
      return { tag: 'capture', next: routerStructure(router.next) };

    case 'raw':
      return { tag: 'raw' };

    case 'choice':
      return {
        tag: 'choice',
        lhs: routerStructure(router.lhs),
        rhs: routerStructure(router.rhs),
      };
  }
}

function routerLayout(router: Router<any, any>): string {
  function mkLayout(c: boolean, router: RouterStructure): string[] {
    switch (router.tag) {
      case 'static':
        return mkSubTrees(c, Object.entries(router.table), router.matches);
      case 'capture':
        return mkSubTree(c, '<capture>', mkLayout(false, router.next));
      case 'raw':
        return c ? ['├─ <raw>'] : ['└─ <raw>'];
      case 'choice':
        return [...mkLayout(true, router.lhs), '┆', ...mkLayout(c, router.rhs)];
    }
  }

  function mkSubTrees(
    c: boolean,
    trs: [string, RouterStructure][],
    n: number,
  ): string[] {
    if (trs.length === 0) {
      return n === 0
        ? []
        : [...[...new Array(n - 1)].flatMap(() => mkLeaf(true)), ...mkLeaf(c)];
    }

    const [[t, r], ...trs_] = trs;
    if (trs_.length === 0 && n === 0) {
      return mkSubTree(c, trs[0][0], mkLayout(false, trs[0][1]));
    }

    return [
      ...mkSubTree(true, t, mkLayout(false, r)),
      ...mkSubTrees(c, trs_, n),
    ];
  }

  function mkSubTree(c: boolean, path: string, children: string[]): string[] {
    return c
      ? [`├─ ${path}/`, ...children.map(p => `│  ${p}`)]
      : [`└─ ${path}/`, ...children.map(p => `   ${p}`)];
  }

  function mkLeaf(c: boolean): string[] {
    return c ? ['├─•', '┆'] : ['└─•'];
  }

  return ['/', ...mkLayout(false, routerStructure(router))].join('\n');
}
