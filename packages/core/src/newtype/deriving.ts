// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '../hkt';
import { Constructor, ConstructorK, Newtype, NewtypeF } from './newtype';

export const newtypeDerive =
  <TCF>() =>
  <Ref extends string, A>(
    ctor: Constructor<Ref, A>,
    TC: Kind<TCF, [A]>,
  ): Kind<TCF, [Newtype<Ref, A>]> =>
    TC as any;

export const newtypeKDerive =
  <TCKF>() =>
  <Ref extends string, F>(
    ctor: ConstructorK<Ref, F>,
    TC: Kind<TCKF, [F]>,
  ): Kind<TCKF, [NewtypeF<Ref, F>]> =>
    TC as any;
