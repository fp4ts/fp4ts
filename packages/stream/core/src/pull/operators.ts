import { AnyK, pipe } from '@cats4ts/core';

import { pure, unit } from './constructors';
import { Bind, Fail, Pull } from './algebra';
import { Option } from '@cats4ts/cats-core/lib/data';

export const toVoid: <F extends AnyK, O, R>(
  p: Pull<F, O, R>,
) => Pull<F, O, void> = p => map_(p, () => {});

export const map: <R, R2>(
  f: (r: R) => R2,
) => <F extends AnyK, O>(pull: Pull<F, O, R>) => Pull<F, O, R2> = f => pull =>
  map_(pull, f);

export const flatMap: <F extends AnyK, O2, R, R2>(
  f: (r: R) => Pull<F, O2, R2>,
) => <O extends O2>(pull: Pull<F, O, R>) => Pull<F, O2, R2> = f => pull =>
  flatMap_(pull, f);

export const handleErrorWith: <F extends AnyK, O2, R2>(
  h: (e: Error) => Pull<F, O2, R2>,
) => <O extends O2, R extends R2>(pull: Pull<F, O, R>) => Pull<F, O2, R2> =
  h => pull =>
    handleErrorWith_(pull, h);

export const onComplete: <F extends AnyK, O2, R2>(
  post: () => Pull<F, O2, R2>,
) => <O extends O2, R extends R2>(pull: Pull<F, O, R>) => Pull<F, O2, R2> =
  post => pull =>
    onComplete_(pull, post);

export const loop =
  <F extends AnyK, O, R>(f: (r: R) => Pull<F, O, Option<R>>) =>
  (r: R): Pull<F, O, void> =>
    pipe(
      f(r),
      flatMap(r => r.fold(() => unit as Pull<F, O, void>, loop(f))),
    );

// -- Point-ful operators

export const map_ = <F extends AnyK, O, R, R2>(
  pull: Pull<F, O, R>,
  f: (r: R) => R2,
): Pull<F, O, R2> => flatMap_(pull, r => pure(f(r)));

export const flatMap_ = <F extends AnyK, O, R, R2>(
  pull: Pull<F, O, R>,
  f: (r: R) => Pull<F, O, R2>,
): Pull<F, O, R2> =>
  new Bind(pull, res => {
    if (res.tag !== 'succeed') return res;
    try {
      return f(res.result);
    } catch (e) {
      return new Fail(e as Error);
    }
  });

export const handleErrorWith_ = <F extends AnyK, O, R>(
  pull: Pull<F, O, R>,
  h: (e: Error) => Pull<F, O, R>,
): Pull<F, O, R> =>
  new Bind(pull, res => {
    if (res.tag !== 'fail') return res;
    try {
      return h(res.error);
    } catch (e) {
      return new Fail(e as Error);
    }
  });

export const onComplete_ = <F extends AnyK, O, R, R2>(
  pull: Pull<F, O, R>,
  post: () => Pull<F, O, R2>,
): Pull<F, O, R2> =>
  pipe(
    pull,
    handleErrorWith(e => flatMap_(post(), () => new Fail(e))),
    flatMap(post),
  );
