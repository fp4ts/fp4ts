// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { AndThen, Concat, isAndThen, Single, view } from './algebra';
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
  const fv = view(f);
  if (fv.tag === 'single') {
    if (fv.idx < fusionMaxStackDepth)
      return Single(x => g(fv.fun(x)), fv.idx + 1);
    return Concat(f, Single(g, 0));
  } else {
    const rv = view(fv.right);
    if (rv.tag === 'single' && rv.idx < fusionMaxStackDepth)
      return Concat(
        fv.left,
        Single(x => g(rv.fun(x)), rv.idx + 1),
      );
    return Concat(f, Single(g, 0));
  }
};

export const compose_ = <A, E, B>(
  g: AndThen<E, B>,
  f: (e: A) => E,
): AndThen<A, B> => {
  if (isAndThen(f)) return _andThen(f, g);
  const gv = view(g);
  if (gv.tag === 'single') {
    if (gv.idx < fusionMaxStackDepth)
      return Single(x => gv.fun(f(x)), gv.idx + 1);
    return Concat(Single(f, 0), g);
  } else {
    const lv = view(gv.left);
    if (lv.tag === 'single' && lv.idx < fusionMaxStackDepth)
      return Concat(
        Single(x => lv.fun(f(x)), lv.idx + 1),
        gv.right,
      );
    return Concat(Single(f, 0), g);
  }
};

// -- Private implementation
const _andThen = <A, B, C>(
  ab: AndThen<A, B>,
  bc: AndThen<B, C>,
): AndThen<A, C> => {
  const fv = view(ab);
  const gv = view(bc);
  if (fv.tag === 'single') {
    const [f, indexF] = [fv.fun, fv.idx];
    if (gv.tag === 'single') {
      const [g, indexG] = [gv.fun, gv.idx];

      return indexF + indexG < fusionMaxStackDepth
        ? Single(x => g(f(x)), indexF + indexG)
        : Concat(ab, bc);
    } else {
      const leftV = view(gv.left);
      if (leftV.tag === 'single' && indexF + leftV.idx < fusionMaxStackDepth) {
        return Concat(
          Single(x => leftV.fun(f(x)), indexF + leftV.idx),
          gv.right,
        );
      } else {
        return Concat(ab, bc);
      }
    }
  }

  const frv = view(fv.right);
  if (frv.tag === 'single') {
    const [f, indexF] = [frv.fun, frv.idx];
    const gv = view(bc);
    if (gv.tag === 'single') {
      const [g, indexG] = [gv.fun, gv.idx];
      return indexF + indexG < fusionMaxStackDepth
        ? Concat(
            fv.left,
            Single(x => g(f(x)), indexF + indexG),
          )
        : Concat(ab, bc);
    } else {
      const leftV = view(gv.left);
      if (leftV.tag === 'single' && indexF + leftV.idx < fusionMaxStackDepth) {
        return Concat(
          fv.left,
          Concat(
            Single(x => leftV.fun(f(x)), indexF + leftV.idx),
            gv.right,
          ),
        );
      } else {
        return Concat(ab, bc);
      }
    }
  } else {
    return Concat(ab, bc);
  }
};
