// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TyK, TyVar } from './ctor';
import { $type } from './symbols';

export interface HKT<F, Vars extends unknown[]> {
  readonly F: F;
  readonly Vars: Vars;
}

export interface HKT1<F> extends TyK<[unknown]> {
  [$type]: HKT<F, [TyVar<this, 0>]>;
}
export interface HKT2<F> extends TyK<[unknown, unknown]> {
  [$type]: HKT<F, [TyVar<this, 0>, TyVar<this, 1>]>;
}
