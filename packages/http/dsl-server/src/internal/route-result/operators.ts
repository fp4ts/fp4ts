// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  None,
  Either,
  Functor,
  Monad,
  OptionT,
  Right,
  Some,
  Left,
} from '@fp4ts/cats';
import { id } from '@fp4ts/core';
import { MessageFailure } from '@fp4ts/http-core';
import { Route, RouteResult, RouteResultT, view } from './algebra';

export const map: <A, B>(
  f: (a: A) => B,
) => (fa: RouteResult<A>) => RouteResult<B> = f => fa => map_(fa, f);

export const orElse: <A>(
  fb: () => RouteResult<A>,
) => (fa: RouteResult<A>) => RouteResult<A> = fb => fa => orElse_(fa, fb);

export const toOptionTEither =
  <F>(F: Functor<F>) =>
  <A>(fa: RouteResultT<F, A>): OptionT<F, Either<MessageFailure, A>> =>
    OptionT<F, Either<MessageFailure, A>>(
      F.map_(fa.value, fa => {
        const va = view(fa);
        switch (va.tag) {
          case 'route':
            return Some(Right(va.value));
          case 'fail':
            return None;
          case 'fatal-fail':
            return Some(Left(va.failure));
        }
      }),
    );

export const flatten = <A>(ffa: RouteResult<RouteResult<A>>): RouteResult<A> =>
  flatMap_(ffa, id);

export const flattenT =
  <F>(F: Monad<F>) =>
  <A>(ffa: RouteResultT<F, RouteResultT<F, A>>): RouteResultT<F, A> =>
    flatMapT_(F)(ffa, id);

// -- Point-ful operators

export const orElse_ = <A>(
  fa: RouteResult<A>,
  fb: () => RouteResult<A>,
): RouteResult<A> => {
  const va = view(fa);
  switch (va.tag) {
    case 'fail':
      return fb();

    case 'route':
    case 'fatal-fail':
      return va;
  }
};

export const map_ = <A, B>(
  fa: RouteResult<A>,
  f: (a: A) => B,
): RouteResult<B> => {
  const v = view(fa);
  switch (v.tag) {
    case 'route':
      return new Route(f(v.value));
    case 'fail':
    case 'fatal-fail':
      return v;
  }
};

export const flatMap_ = <A, B>(
  fa: RouteResult<A>,
  f: (a: A) => RouteResult<B>,
): RouteResult<B> => {
  const v = view(fa);
  switch (v.tag) {
    case 'route':
      return f(v.value);
    case 'fail':
    case 'fatal-fail':
      return v;
  }
};

export const mapT_ =
  <F>(F: Functor<F>) =>
  <A, B>(fa: RouteResultT<F, A>, f: (a: A) => B): RouteResultT<F, B> =>
    new RouteResultT(F.map_(fa.value, map(f)));

export const orElseT_ =
  <F>(F: Monad<F>) =>
  <A>(
    fa: RouteResultT<F, A>,
    fb: () => RouteResultT<F, A>,
  ): RouteResultT<F, A> =>
    new RouteResultT(
      F.flatMap_(fa.value, fa => {
        const va = view(fa);
        switch (va.tag) {
          case 'fail':
            return fb().value;
          case 'route':
          case 'fatal-fail':
            return F.pure(va);
        }
      }),
    );

export const flatMapT_ =
  <F>(F: Monad<F>) =>
  <A, B>(
    fa: RouteResultT<F, A>,
    f: (a: A) => RouteResultT<F, B>,
  ): RouteResultT<F, B> =>
    new RouteResultT(
      F.flatMap_(fa.value, fa => {
        const va = view(fa);
        switch (va.tag) {
          case 'route':
            return f(va.value).value;
          case 'fail':
          case 'fatal-fail':
            return F.pure(va);
        }
      }),
    );
