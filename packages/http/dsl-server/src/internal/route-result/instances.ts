// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Lazy, lazyVal, flow } from '@fp4ts/core';
import { Alternative, Either, Functor, Left, Monad, Right } from '@fp4ts/cats';

import { Route, RouteResult, RouteResultT, view } from './algebra';
import { fail, liftF, succeed } from './constructors';
import {
  flatMapT_,
  flatMap_,
  mapT_,
  map_,
  orElseT_,
  orElse_,
} from './operators';
import type { RouteResultK, RouteResultTK } from './route-result';
import { NotFoundFailure } from '@fp4ts/http-core';

export const routeResultFunctor: Lazy<Functor<RouteResultK>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const routeResultAlternative: Lazy<Alternative<RouteResultK>> = lazyVal(
  () =>
    Alternative.of({
      ...routeResultMonad(),
      combineK_: orElse_,
      emptyK: <A>() => fail<A>(new NotFoundFailure()),
    }),
);

export const routeResultMonad: Lazy<Monad<RouteResultK>> = lazyVal(() =>
  Monad.of({
    ...routeResultFunctor(),
    flatMap_: flatMap_,
    pure: succeed,
    tailRecM_: <A, B>(
      a: A,
      f: (a: A) => RouteResult<Either<A, B>>,
    ): RouteResult<B> => {
      let cur: RouteResult<Either<A, B>> = f(a);
      let result: RouteResult<B> | undefined;

      while (!result) {
        const v = view(cur);
        switch (v.tag) {
          case 'fail':
          case 'fatal-fail':
            result = v;
            break;

          case 'route':
            v.value.fold(
              a => {
                cur = f(a);
              },
              b => {
                result = new Route(b);
              },
            );
            break;
        }
      }

      return result;
    },
  }),
);

export const routeResultTFunctor: <F>(
  F: Functor<F>,
) => Functor<$<RouteResultTK, [F]>> = F => Functor.of({ map_: mapT_(F) });

export const routeResultTAlternative: <F>(
  F: Monad<F>,
) => Alternative<$<RouteResultTK, [F]>> = F =>
  Alternative.of({
    ...routeResultTMonad(F),
    emptyK: <A>() => new RouteResultT(F.pure(fail<A>(new NotFoundFailure()))),
    combineK_: orElseT_(F),
  });

export const routeResultTMonad: <F>(
  F: Monad<F>,
) => Monad<$<RouteResultTK, [F]>> = (() => {
  const cache = new Map<any, Monad<any>>();
  return <F>(F: Monad<F>) => {
    if (cache.has(F)) return cache.get(F)!;
    const instance = Monad.of({
      ...routeResultTFunctor(F),
      flatMap_: flatMapT_(F),
      pure: flow(F.pure, liftF(F)),
      tailRecM_: <A, B>(
        s0: A,
        f: (a: A) => RouteResultT<F, Either<A, B>>,
      ): RouteResultT<F, B> =>
        new RouteResultT(
          F.tailRecM_(s0, s0 =>
            F.map_(f(s0).value, rr => {
              const vr = view(rr);
              switch (vr.tag) {
                case 'route':
                  return vr.value.fold(
                    s => Left(s),
                    a => Right(new Route(a)),
                  );
                case 'fail':
                case 'fatal-fail':
                  return Right(vr);
              }
            }),
          ),
        ),
    });
    cache.set(F, instance);
    return instance;
  };
})();
