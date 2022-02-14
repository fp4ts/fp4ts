// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Kind, TyK, TyVar } from '@fp4ts/core';

/* eslint-disable @typescript-eslint/ban-types */
export interface StructK<A extends {}> extends TyK<[unknown]> {
  [$type]: { [k in keyof A]: Kind<A[k], [TyVar<this, 0>]> };
}

export interface ProductK<A extends unknown[]> extends TyK<[unknown]> {
  [$type]: { [k in keyof A]: Kind<A[k], [TyVar<this, 0>]> };
}

export interface SumK<A extends {}> extends TyK<[unknown]> {
  [$type]: { [k in keyof A]: Kind<A[k], [TyVar<this, 0>]> }[keyof A];
}
