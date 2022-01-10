import { Kleisli, Monad, OptionT } from '@fp4ts/cats';
import { Http, HttpRoutes, Request, Response } from '@fp4ts/http-core';

export type Router<env, a> =
  | StaticRouter<env, a>
  | CaptureRouter<env, a>
  | Choice<env, a>;

export class StaticRouter<env, a> {
  public readonly tag = 'static';
  public constructor(
    public readonly table: Record<string, Router<env, a>>,
    public readonly matches?: (e: env) => a,
  ) {}
}

export class CaptureRouter<env, a> {
  public readonly tag = 'capture';
  public constructor(public readonly next: Router<[string, env], a>) {}
}

export class Choice<env, a> {
  public readonly tag = 'choice';
  public constructor(public readonly choices: Router<env, a>[]) {}
}

export const pathRouter = <env, a>(
  p: string,
  r: Router<env, a>,
): Router<env, a> => new StaticRouter({ [p]: r });

export const leafRouter = <env, a>(l: (e: env) => a): Router<env, a> =>
  new StaticRouter({}, l);

export const choice = <env, a>(...xs: Router<env, a>[]): Router<env, a> =>
  new Choice(xs);

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
          if (rem.length === 0 && router.matches)
            // pick one of the end routes as we have a match
            return OptionT.liftF(F)(router.matches(env).run(req));

          if (rem[0] === '' && router.matches)
            // pick one of the end routes as we have a match
            // trailing `/`
            return OptionT.liftF(F)(router.matches(env).run(req));

          if (router.table[rem[0]]) {
            return loop(req, router.table[rem[0]], env, rem.slice(1));
          }

          return OptionT.none(F);
        }

        case 'capture': {
          if (rem.length === 0)
            // nothing to capture
            return OptionT.none(F);

          if (rem[0] === '')
            // nothing to capture
            // tailing `/`
            return OptionT.none(F);

          const [pfx, ...sfx] = rem;
          return loop(req, router.next, [pfx, env], sfx);
        }

        case 'choice': {
          return router.choices.reduce(
            (r: OptionT<F, Response<F>>, n) =>
              r.orElse(F)(() => loop(req, n, env, rem)),
            OptionT.none(F),
          );
        }
      }
    };

    return Kleisli(req =>
      loop(req, router, env, req.uri.path.components.slice(1)),
    );
  };
