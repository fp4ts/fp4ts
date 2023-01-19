// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '../hkt';
import { Constructor, Newtype } from './newtype';
import { TypeOf } from './type-ref';

export const newtypeDerive =
  <TCF>() =>
  <Ref extends string, A>(
    ctor: Constructor<Ref, A>,
    TC: Kind<TCF, [A]>,
  ): Kind<TCF, [Newtype<Ref, A>]> =>
    TC as any;

// prettier-ignore
type IsEqviv<F, G> =
  [TypeOf<Kind<F, unknown[]>>, Kind<G, unknown[]>] extends [infer F, infer G]
    ? [F, G] extends [G, F]
      ? []
      : [never]
    : [never];

export const newtypeKDerive =
  <TCKF, NF>() =>
  <F>(TC: Kind<TCKF, [F]>, ...ev: IsEqviv<NF, F>): Kind<TCKF, [NF]> =>
    TC as any;
