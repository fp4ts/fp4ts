// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { AndThen, Concat, isAndThen, Single, View, view } from './algebra';
import { fusionMaxStackDepth } from './consts';

export const andThen: <E, B>(
  g: (e: E) => B,
) => <A>(f: AndThen<A, E>) => AndThen<A, B> = g => f => andThen_(f, g);

export const compose: <A, E>(
  f: (e: A) => E,
) => <B>(f: AndThen<E, B>) => AndThen<A, B> = f => g => compose_(g, f);

// -- Point-ful operators

export const andThen_ = <A, E, B>(
  f: AndThen<A, E>,
  g: (e: E) => B,
): AndThen<A, B> => {
  if (isAndThen(g)) return _andThen(f, g);
  const fv = f as View<A, E>;
  if (fv.tag === 'single') {
    return fv.idx < fusionMaxStackDepth
      ? Single(x => g(fv.fun(x)), fv.idx + 1)
      : Concat(f, Single(g, 0));
  } else {
    const rv = fv.right as View<any, E>;
    return rv.tag === 'single' && rv.idx < fusionMaxStackDepth
      ? Concat(
          fv.left,
          Single(x => g(rv.fun(x)), rv.idx + 1),
        )
      : Concat(f, Single(g, 0));
  }
};

export const compose_ = <A, E, B>(
  g: AndThen<E, B>,
  f: (e: A) => E,
): AndThen<A, B> => {
  if (isAndThen(f)) return _andThen(f, g);
  const gv = view(g);
  if (gv.tag === 'single') {
    return gv.idx < fusionMaxStackDepth
      ? Single(x => gv.fun(f(x)), gv.idx + 1)
      : Concat(Single(f, 0), g);
  } else {
    const lv = view(gv.left);
    return lv.tag === 'single' && lv.idx < fusionMaxStackDepth
      ? Concat(
          Single(x => lv.fun(f(x)), lv.idx + 1),
          gv.right,
        )
      : Concat(Single(f, 0), g);
  }
};

// -- Private implementation
const _andThen = <A, B, C>(
  ab: AndThen<A, B>,
  bc: AndThen<B, C>,
): AndThen<A, C> => {
  const fv = ab as View<A, B>;
  const gv = bc as View<B, C>;
  if (fv.tag === 'single') {
    const f = fv.fun;
    const indexF = fv.idx;
    if (gv.tag === 'single') {
      const g = gv.fun;
      const indexG = gv.idx;

      return indexF + indexG < fusionMaxStackDepth
        ? Single(x => g(f(x)), indexF + indexG)
        : Concat(ab, bc);
    } else {
      const leftV = gv.left as View<B, any>;
      return leftV.tag === 'single' && indexF + leftV.idx < fusionMaxStackDepth
        ? Concat(
            Single(x => leftV.fun(f(x)), indexF + leftV.idx),
            gv.right,
          )
        : Concat(ab, bc);
    }
  }

  const frv = fv.right as View<any, B>;
  if (frv.tag === 'single') {
    const f = frv.fun;
    const indexF = frv.idx;
    const gv = bc as View<B, C>;
    if (gv.tag === 'single') {
      const g = gv.fun;
      const indexG = gv.idx;
      return indexF + indexG < fusionMaxStackDepth
        ? Concat(
            fv.left,
            Single(x => g(f(x)), indexF + indexG),
          )
        : Concat(ab, bc);
    } else {
      const leftV = gv.left as View<B, any>;
      return leftV.tag === 'single' && indexF + leftV.idx < fusionMaxStackDepth
        ? Concat(
            fv.left,
            Concat(
              Single(x => leftV.fun(f(x)), indexF + leftV.idx),
              gv.right,
            ),
          )
        : Concat(ab, bc);
    }
  } else {
    return Concat(ab, bc);
  }
};
