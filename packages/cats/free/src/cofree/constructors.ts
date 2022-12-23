// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, id, Kind } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats-core';
import { Cofree } from './algebra';

export const unfold =
  <F>(F: Functor<F>) =>
  <A>(a: A) =>
  (f: (a: A) => Kind<F, [A]>): Cofree<F, A> =>
    ana(F)(a)(f, id);

export const unfoldEval =
  <F>(F: Functor<F>) =>
  <A>(a: A) =>
  (f: (a: A) => Eval<Kind<F, [A]>>): Cofree<F, A> =>
    anaEval(F)(a)(f, id);

export const ana =
  <F>(F: Functor<F>) =>
  <A>(a: A) =>
  <B>(coalg: (a: A) => Kind<F, [A]>, f: (a: A) => B): Cofree<F, B> =>
    anaEval(F)(a)(a => Eval.later(() => coalg(a)), f);

export const anaEval = <F>(F: Functor<F>) => {
  const anaEval =
    <A>(a: A) =>
    <B>(coalg: (a: A) => Eval<Kind<F, [A]>>, f: (a: A) => B): Cofree<F, B> =>
      new Cofree(
        f(a),
        coalg(a).map(fa => F.map_(fa, x => anaEval(x)(coalg, f))),
      );
  return anaEval;
};
